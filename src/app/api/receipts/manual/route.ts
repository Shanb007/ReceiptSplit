import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const manualReceiptSchema = z.object({
  groupId: z.string().min(1),
  payerId: z.string().min(1),
  merchantName: z.string().max(200).optional(),
  receiptDate: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = manualReceiptSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { groupId, payerId, merchantName, receiptDate } = parsed.data

    // Verify user owns the group
    const group = await prisma.group.findFirst({
      where: { id: groupId, userId: session.user.id },
      include: { members: { select: { id: true } } },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Verify payer is a member
    if (!group.members.some((m) => m.id === payerId)) {
      return NextResponse.json(
        { error: 'Payer is not a member of this group' },
        { status: 400 },
      )
    }

    // Create receipt in REVIEW status — user will add items manually
    const receipt = await prisma.receipt.create({
      data: {
        groupId,
        payerId,
        merchantName: merchantName || null,
        receiptDate: receiptDate ? new Date(receiptDate) : null,
        status: 'REVIEW',
      },
    })

    return NextResponse.json(receipt, { status: 201 })
  } catch (error) {
    console.error('Failed to create manual receipt:', error)
    return NextResponse.json(
      { error: 'Failed to create receipt' },
      { status: 500 },
    )
  }
}
