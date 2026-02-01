import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { imageStore } from '@/lib/image-store'
import { extractReceiptData } from '@/lib/openai'
import { isLocalMode } from '@/lib/mode'

const FREE_SCAN_LIMIT = 5

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const image = formData.get('image') as File | null
    const groupId = formData.get('groupId') as string | null
    const payerId = formData.get('payerId') as string | null

    if (!image || !groupId || !payerId) {
      return NextResponse.json(
        { error: 'Image, groupId, and payerId are required' },
        { status: 400 }
      )
    }

    // Verify the user owns this group
    const group = await prisma.group.findFirst({
      where: { id: groupId, userId: session.user.id },
      include: { members: { select: { id: true } } },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Verify payer is a member of the group
    if (!group.members.some((m) => m.id === payerId)) {
      return NextResponse.json(
        { error: 'Payer must be a member of the group' },
        { status: 400 }
      )
    }

    // ── BYO key + scan limit (cloud mode only) ──
    let userApiKey: string | undefined
    if (!isLocalMode) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { openaiApiKey: true, scanCount: true, scanResetDate: true },
      })

      if (user?.openaiApiKey) {
        try {
          const { decrypt } = await import('@/lib/encryption')
          userApiKey = decrypt(user.openaiApiKey)
        } catch {
          // Decryption failed — treat as no key
        }
      }

      if (!userApiKey) {
        const now = new Date()
        let currentCount = user?.scanCount ?? 0

        if (user?.scanResetDate) {
          const resetDate = new Date(user.scanResetDate)
          if (
            resetDate.getMonth() !== now.getMonth() ||
            resetDate.getFullYear() !== now.getFullYear()
          ) {
            currentCount = 0
          }
        }

        if (currentCount >= FREE_SCAN_LIMIT) {
          return NextResponse.json(
            {
              error: `You've used your ${FREE_SCAN_LIMIT} free scans this month. Add your own OpenAI API key in Settings for unlimited scans, or self-host the open-source version.`,
              code: 'SCAN_LIMIT_REACHED',
            },
            { status: 403 },
          )
        }
      }
    }

    // 1. Create receipt in PROCESSING state
    const receipt = await prisma.receipt.create({
      data: {
        groupId,
        payerId,
        status: 'PROCESSING',
      },
    })

    try {
      // 2. Upload image (returns URL in cloud mode, null in local mode)
      const buffer = Buffer.from(await image.arrayBuffer())
      const imageUrl = await imageStore.upload(buffer, image.name)

      // Update receipt with image URL if we have one
      if (imageUrl) {
        await prisma.receipt.update({
          where: { id: receipt.id },
          data: { imageUrl },
        })
      }

      // 3. Build the image source for OpenAI
      // In local mode (imageUrl is null), convert to base64 data URI
      const ocrSource = imageUrl
        ?? `data:${image.type || 'image/jpeg'};base64,${buffer.toString('base64')}`

      // 4. Extract data with OpenAI
      const extraction = await extractReceiptData(
        ocrSource,
        isLocalMode ? undefined : userApiKey
      )

      // 5. Save extracted data to database
      const updatedReceipt = await prisma.receipt.update({
        where: { id: receipt.id },
        data: {
          merchantName: extraction.receipt.merchantName,
          receiptDate: extraction.receipt.receiptDate,
          subtotal: extraction.receipt.subtotal,
          tax: extraction.receipt.tax,
          tip: extraction.receipt.tip,
          total: extraction.receipt.total,
          rawExtraction: extraction.raw as object,
          status: 'REVIEW',
          lineItems: {
            create: extraction.lineItems.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              confidence: item.confidence,
              confidenceReason: item.confidenceReason,
              sortOrder: item.sortOrder,
            })),
          },
        },
        include: {
          lineItems: {
            orderBy: { sortOrder: 'asc' },
          },
          payer: true,
        },
      })

      // 6. Increment scan count (cloud mode only, no BYO key)
      if (!isLocalMode && !userApiKey) {
        const now = new Date()
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { scanCount: true, scanResetDate: true },
        })
        let newCount = (user?.scanCount ?? 0) + 1

        if (user?.scanResetDate) {
          const resetDate = new Date(user.scanResetDate)
          if (
            resetDate.getMonth() !== now.getMonth() ||
            resetDate.getFullYear() !== now.getFullYear()
          ) {
            newCount = 1
          }
        }

        await prisma.user.update({
          where: { id: session.user.id },
          data: { scanCount: newCount, scanResetDate: now },
        })
      }

      return NextResponse.json(updatedReceipt, { status: 201 })
    } catch (extractionError) {
      // If extraction fails, keep the receipt but mark as failed
      console.error('Extraction failed:', extractionError)
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: { status: 'PENDING' },
      })

      const message =
        extractionError instanceof Error
          ? extractionError.message
          : 'Failed to process receipt'

      return NextResponse.json(
        { error: message, receiptId: receipt.id },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Failed to create receipt:', error)
    return NextResponse.json(
      { error: 'Failed to create receipt' },
      { status: 500 }
    )
  }
}
