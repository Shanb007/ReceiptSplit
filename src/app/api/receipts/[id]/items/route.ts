import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Bulk update line items
const updateItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  quantity: z.number().int().min(1).optional(),
  unitPrice: z.number().int().min(0).optional(),
  lineTotal: z.number().int().min(0).optional(),
  isValid: z.boolean().optional(),
})

const bulkUpdateSchema = z.object({
  items: z.array(updateItemSchema),
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
    const parsed = bulkUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Verify ownership
    const receipt = await prisma.receipt.findFirst({
      where: { id, group: { userId: session.user.id } },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // Update each item in a transaction
    await prisma.$transaction(
      parsed.data.items.map((item) =>
        prisma.lineItem.update({
          where: { id: item.id, receiptId: id },
          data: {
            ...(item.name !== undefined && { name: item.name }),
            ...(item.quantity !== undefined && { quantity: item.quantity }),
            ...(item.unitPrice !== undefined && { unitPrice: item.unitPrice }),
            ...(item.lineTotal !== undefined && { lineTotal: item.lineTotal }),
            ...(item.isValid !== undefined && { isValid: item.isValid }),
          },
        })
      )
    )

    // Return updated receipt with all items
    const updated = await prisma.receipt.findUnique({
      where: { id },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        payer: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update items:', error)
    return NextResponse.json(
      { error: 'Failed to update items' },
      { status: 500 }
    )
  }
}

// Add a new item manually
const addItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().int().min(0),
  lineTotal: z.number().int().min(0),
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
    const parsed = addItemSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Verify ownership
    const receipt = await prisma.receipt.findFirst({
      where: { id, group: { userId: session.user.id } },
      include: { lineItems: { orderBy: { sortOrder: 'desc' }, take: 1 } },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    const nextSortOrder = (receipt.lineItems[0]?.sortOrder ?? -1) + 1

    const item = await prisma.lineItem.create({
      data: {
        receiptId: id,
        name: parsed.data.name,
        quantity: parsed.data.quantity,
        unitPrice: parsed.data.unitPrice,
        lineTotal: parsed.data.lineTotal,
        confidence: 'HIGH',
        sortOrder: nextSortOrder,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Failed to add item:', error)
    return NextResponse.json(
      { error: 'Failed to add item' },
      { status: 500 }
    )
  }
}
