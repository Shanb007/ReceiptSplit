import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeSettlements } from '@/lib/settlement-engine'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Fetch receipt with line items, payer, and group
    const receipt = await prisma.receipt.findFirst({
      where: {
        id,
        group: { userId: session.user.id },
      },
      include: {
        lineItems: {
          where: { isValid: true },
          orderBy: { sortOrder: 'asc' },
        },
        payer: true,
      },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    if (!receipt.payerId) {
      return NextResponse.json(
        { error: 'No payer set for this receipt. Please set a payer before settling.' },
        { status: 400 },
      )
    }

    // Fetch assignments
    const assignments = await prisma.itemAssignment.findMany({
      where: { lineItem: { receiptId: id } },
      orderBy: { createdAt: 'asc' },
    })

    if (assignments.length === 0) {
      return NextResponse.json(
        { error: 'No item assignments found. Please split items before settling.' },
        { status: 400 },
      )
    }

    // Compute settlements
    const results = computeSettlements(
      receipt.lineItems.map((li) => ({ id: li.id, lineTotal: li.lineTotal })),
      assignments.map((a) => ({
        lineItemId: a.lineItemId,
        memberId: a.memberId,
        shareNumerator: a.shareNumerator,
        shareDenominator: a.shareDenominator,
      })),
      receipt.tax || 0,
      receipt.tip || 0,
      receipt.taxStrategy,
      receipt.tipStrategy,
    )

    // Save in transaction
    const settlements = await prisma.$transaction(async (tx) => {
      // Delete existing settlements
      await tx.settlement.deleteMany({
        where: { receiptId: id },
      })

      // Create new settlements
      if (results.length > 0) {
        await tx.settlement.createMany({
          data: results.map((r) => ({
            receiptId: id,
            memberId: r.memberId,
            itemsTotal: r.itemsTotal,
            taxShare: r.taxShare,
            tipShare: r.tipShare,
            finalAmount: r.finalAmount,
          })),
        })
      }

      // Update receipt status to SETTLED
      await tx.receipt.update({
        where: { id },
        data: { status: 'SETTLED' },
      })

      // Return saved settlements with member info
      return tx.settlement.findMany({
        where: { receiptId: id },
        include: {
          member: { select: { id: true, name: true } },
        },
      })
    })

    return NextResponse.json({ settlements })
  } catch (error) {
    console.error('Failed to compute settlement:', error)
    return NextResponse.json(
      { error: 'Failed to compute settlement' },
      { status: 500 },
    )
  }
}
