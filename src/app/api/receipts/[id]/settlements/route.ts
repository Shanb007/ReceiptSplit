import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const receipt = await prisma.receipt.findFirst({
      where: {
        id,
        group: { userId: session.user.id },
      },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    const settlements = await prisma.settlement.findMany({
      where: { receiptId: id },
      include: {
        member: { select: { id: true, name: true } },
      },
      orderBy: { member: { name: 'asc' } },
    })

    return NextResponse.json({ settlements })
  } catch (error) {
    console.error('Failed to fetch settlements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settlements' },
      { status: 500 },
    )
  }
}
