import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  members: z.array(
    z.object({
      name: z.string().min(1).max(50),
      isPayer: z.boolean().default(false),
    })
  ).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createGroupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, members } = parsed.data

    const group = await prisma.group.create({
      data: {
        name,
        userId: session.user.id,
        members: {
          create: members.map((m) => ({
            name: m.name,
            isPayer: m.isPayer,
          })),
        },
      },
      include: {
        members: true,
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Failed to create group:', error)
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groups = await prisma.group.findMany({
      where: { userId: session.user.id },
      include: {
        members: true,
        receipts: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Failed to fetch groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}
