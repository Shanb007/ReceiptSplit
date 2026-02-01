import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGroups, SplitwiseError } from '@/lib/splitwise'
import { z } from 'zod'

const importSchema = z.object({
  splitwiseGroupId: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = importSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { splitwiseGroupId } = parsed.data

    // Check user has Splitwise connected
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

    // Check group isn't already imported
    const existing = await prisma.group.findFirst({
      where: {
        userId: session.user.id,
        splitwiseGroupId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'This Splitwise group has already been imported.', groupId: existing.id },
        { status: 409 },
      )
    }

    // Fetch Splitwise groups to find the selected one
    const swGroups = await getGroups(user.splitwiseToken)
    const swGroup = swGroups.find((g) => g.id === splitwiseGroupId)

    if (!swGroup) {
      return NextResponse.json(
        { error: 'Splitwise group not found.' },
        { status: 404 },
      )
    }

    // Create local group with members
    const group = await prisma.group.create({
      data: {
        name: swGroup.name,
        userId: session.user.id,
        splitwiseGroupId,
        members: {
          create: swGroup.members.map((m) => ({
            name: [m.first_name, m.last_name].filter(Boolean).join(' ').trim() || 'Unknown',
            splitwiseUserId: String(m.id),
          })),
        },
      },
      include: {
        members: true,
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    if (error instanceof SplitwiseError) {
      if (error.status === 401) {
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
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      )
    }

    console.error('Failed to import Splitwise group:', error)
    return NextResponse.json(
      { error: 'Failed to import group' },
      { status: 500 },
    )
  }
}
