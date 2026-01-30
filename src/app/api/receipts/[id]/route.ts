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

    const receipt = await prisma.receipt.findFirst({
      where: {
        id,
        group: { userId: session.user.id },
      },
      include: {
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        payer: true,
        group: {
          include: {
            members: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    return NextResponse.json(receipt)
  } catch (error) {
    console.error('Failed to fetch receipt:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receipt' },
      { status: 500 }
    )
  }
}

const updateReceiptSchema = z.object({
  merchantName: z.string().optional(),
  receiptDate: z.string().optional(),
  payerId: z.string().optional(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  tip: z.number().optional(),
  total: z.number().optional(),
  taxStrategy: z.enum(['PROPORTIONAL', 'EQUAL']).optional(),
  tipStrategy: z.enum(['PROPORTIONAL', 'EQUAL']).optional(),
  status: z
    .enum(['PENDING', 'PROCESSING', 'REVIEW', 'SPLITTING', 'SETTLED', 'EXPORTED'])
    .optional(),
})

export async function PUT(
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
    const parsed = updateReceiptSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Verify ownership
    const existing = await prisma.receipt.findFirst({
      where: {
        id,
        group: { userId: session.user.id },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = { ...parsed.data }

    // Convert date string to Date object if provided
    if (parsed.data.receiptDate) {
      data.receiptDate = new Date(parsed.data.receiptDate)
    }

    const receipt = await prisma.receipt.update({
      where: { id },
      data,
      include: {
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        payer: true,
      },
    })

    return NextResponse.json(receipt)
  } catch (error) {
    console.error('Failed to update receipt:', error)
    return NextResponse.json(
      { error: 'Failed to update receipt' },
      { status: 500 }
    )
  }
}
