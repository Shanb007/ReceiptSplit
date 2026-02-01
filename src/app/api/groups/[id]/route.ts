import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { deleteReceiptImage } from '@/lib/cloudinary'

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  splitwiseGroupId: z.number().int().nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const group = await prisma.group.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        members: true,
        receipts: {
          include: {
            lineItems: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Failed to fetch group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    )
  }
}

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
    const parsed = updateGroupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const group = await prisma.group.updateMany({
      where: {
        id,
        userId: session.user.id,
      },
      data: parsed.data,
    })

    if (group.count === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const updatedGroup = await prisma.group.findUnique({
      where: { id },
      include: { members: true },
    })

    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error('Failed to update group:', error)
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Fetch receipt images before cascade delete
    const receipts = await prisma.receipt.findMany({
      where: { groupId: id, group: { userId: session.user.id }, imageUrl: { not: null } },
      select: { imageUrl: true },
    })

    const deleted = await prisma.group.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Clean up Cloudinary images (best-effort)
    for (const r of receipts) {
      if (r.imageUrl) {
        deleteReceiptImage(r.imageUrl).catch(() => {})
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete group:', error)
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    )
  }
}
