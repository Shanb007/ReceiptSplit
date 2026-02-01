import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  createExpense,
  SplitwiseError,
  type CreateExpenseUser,
} from '@/lib/splitwise'

function centsToString(cents: number): string {
  return (cents / 100).toFixed(2)
}

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

    // Fetch user's Splitwise token
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { splitwiseToken: true },
    })

    if (!user?.splitwiseToken) {
      return NextResponse.json(
        { error: 'Splitwise not connected. Please connect in Settings.' },
        { status: 400 },
      )
    }

    // Fetch receipt with settlements, payer, and group members
    const receipt = await prisma.receipt.findFirst({
      where: {
        id,
        group: { userId: session.user.id },
      },
      include: {
        payer: true,
        settlements: {
          include: {
            member: {
              select: { id: true, name: true, splitwiseUserId: true },
            },
          },
        },
        group: {
          include: {
            members: {
              select: { id: true, name: true, splitwiseUserId: true },
            },
          },
        },
      },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    if (receipt.status !== 'SETTLED' && receipt.status !== 'EXPORTED') {
      return NextResponse.json(
        { error: 'Receipt must be settled before exporting.' },
        { status: 400 },
      )
    }

    if (!receipt.payerId || !receipt.payer) {
      return NextResponse.json(
        { error: 'No payer set for this receipt.' },
        { status: 400 },
      )
    }

    if (receipt.settlements.length === 0) {
      return NextResponse.json(
        { error: 'No settlements found. Please compute settlement first.' },
        { status: 400 },
      )
    }

    // Check payer has Splitwise mapping
    const payerMember = receipt.group.members.find(
      (m) => m.id === receipt.payerId,
    )
    if (!payerMember?.splitwiseUserId) {
      return NextResponse.json(
        {
          error: 'Payer is not mapped to a Splitwise account.',
          unmappedMembers: [payerMember?.name || 'Unknown'],
        },
        { status: 400 },
      )
    }

    // Check all settlement members have Splitwise mapping
    const unmapped = receipt.settlements
      .filter((s) => !s.member.splitwiseUserId)
      .map((s) => s.member.name)

    if (unmapped.length > 0) {
      return NextResponse.json(
        {
          error: `Some members are not mapped to Splitwise: ${unmapped.join(', ')}`,
          unmappedMembers: unmapped,
        },
        { status: 400 },
      )
    }

    // Build expense params
    const totalCost = receipt.total || 0
    const costString = centsToString(totalCost)

    const users: CreateExpenseUser[] = []
    let owedSum = 0

    for (let i = 0; i < receipt.settlements.length; i++) {
      const s = receipt.settlements[i]
      const isPayer = s.memberId === receipt.payerId
      const owedShare = centsToString(s.finalAmount)

      // Track sum for rounding adjustment
      owedSum += s.finalAmount

      users.push({
        user_id: Number(s.member.splitwiseUserId),
        paid_share: isPayer ? costString : '0.00',
        owed_share: owedShare,
      })
    }

    // Adjust for rounding: ensure sum(owed_shares) == cost
    const roundingDiff = totalCost - owedSum
    if (roundingDiff !== 0 && users.length > 0) {
      const lastUser = users[users.length - 1]
      const lastOwedCents =
        receipt.settlements[receipt.settlements.length - 1].finalAmount +
        roundingDiff
      lastUser.owed_share = centsToString(lastOwedCents)
    }

    // Format date
    const date = receipt.receiptDate
      ? new Date(receipt.receiptDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

    // Create expense on Splitwise
    const result = await createExpense(user.splitwiseToken, {
      cost: costString,
      description: receipt.merchantName || 'Receipt from ReceiptSplit',
      date,
      currency_code: 'USD',
      users,
    })

    // Update receipt status to EXPORTED
    await prisma.receipt.update({
      where: { id },
      data: { status: 'EXPORTED' },
    })

    return NextResponse.json({
      success: true,
      expenseId: result.id,
    })
  } catch (error) {
    if (error instanceof SplitwiseError) {
      if (error.status === 401) {
        // Token expired — clear it
        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
          await prisma.user.update({
            where: { id: session.user.id },
            data: { splitwiseToken: null, splitwiseUserId: null },
          })
        }
        return NextResponse.json(
          { error: 'Splitwise token expired. Please reconnect in Settings.' },
          { status: 401 },
        )
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Rate limited by Splitwise. Please try again later.' },
          { status: 429 },
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      )
    }

    console.error('Failed to export to Splitwise:', error)
    return NextResponse.json(
      { error: 'Failed to export to Splitwise' },
      { status: 500 },
    )
  }
}
