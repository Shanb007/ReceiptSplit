import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadReceiptImage } from '@/lib/cloudinary'
import { extractReceiptData } from '@/lib/openai'

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

    // 1. Create receipt in PROCESSING state
    const receipt = await prisma.receipt.create({
      data: {
        groupId,
        payerId,
        status: 'PROCESSING',
      },
    })

    try {
      // 2. Upload image to Cloudinary
      const buffer = Buffer.from(await image.arrayBuffer())
      const imageUrl = await uploadReceiptImage(buffer, image.name)

      // Update receipt with image URL
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: { imageUrl },
      })

      // 3. Extract data with OpenAI
      const extraction = await extractReceiptData(imageUrl)

      // 4. Save extracted data to database
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
