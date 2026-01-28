import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addMemberSchema = z.object({
  name: z.string().min(1).max(50),
  isPayer: z.boolean().default(false),
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

    const { id: groupId } = await params
    const body = await request.json()
    const parsed = addMemberSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Verify group belongs to user
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        userId: session.user.id,
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // If new member is payer, unset existing payer
    if (parsed.data.isPayer) {
      await prisma.member.updateMany({
        where: { groupId },
        data: { isPayer: false },
      })
    }

    const member = await prisma.member.create({
      data: {
        name: parsed.data.name,
        isPayer: parsed.data.isPayer,
        groupId,
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Failed to add member:', error)
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    )
  }
}
