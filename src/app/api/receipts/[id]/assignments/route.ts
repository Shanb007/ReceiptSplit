import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const assignments = await prisma.itemAssignment.findMany({
      where: {
        lineItem: { receiptId: id },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Failed to fetch assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

const assignmentSchema = z.object({
  lineItemId: z.string(),
  memberId: z.string(),
  shareNumerator: z.number().int().min(1).default(1),
  shareDenominator: z.number().int().min(1).default(1),
})

const bulkAssignmentsSchema = z.object({
  assignments: z.array(assignmentSchema),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = bulkAssignmentsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

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

    // Replace all assignments in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing assignments for this receipt
      await tx.itemAssignment.deleteMany({
        where: { lineItem: { receiptId: id } },
      })

      // Insert new assignments
      if (parsed.data.assignments.length > 0) {
        await tx.itemAssignment.createMany({
          data: parsed.data.assignments,
        })
      }

      // Update receipt status to SPLITTING
      await tx.receipt.update({
        where: { id },
        data: { status: 'SPLITTING' },
      })

      // Return the saved assignments
      return tx.itemAssignment.findMany({
        where: { lineItem: { receiptId: id } },
        orderBy: { createdAt: 'asc' },
      })
    })

    return NextResponse.json({ assignments: result })
  } catch (error) {
    console.error('Failed to save assignments:', error)
    return NextResponse.json(
      { error: 'Failed to save assignments' },
      { status: 500 }
    )
  }
}
