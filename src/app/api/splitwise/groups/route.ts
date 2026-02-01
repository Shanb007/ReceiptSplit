import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGroups, SplitwiseError } from '@/lib/splitwise'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { splitwiseToken: true },
    })

    if (!user?.splitwiseToken) {
      return NextResponse.json(
        { error: 'Splitwise not connected' },
        { status: 400 },
      )
    }

    const groups = await getGroups(user.splitwiseToken)

    return NextResponse.json({
      groups: groups
        .filter((g) => g.id !== 0) // Filter out the "non-group" expenses group
        .map((g) => ({
          id: g.id,
          name: g.name,
          members: g.members.map((m) => ({
            id: m.id,
            first_name: m.first_name,
            last_name: m.last_name,
            email: m.email,
          })),
        })),
    })
  } catch (error) {
    if (error instanceof SplitwiseError && error.status === 401) {
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

    console.error('Failed to fetch Splitwise groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 },
    )
  }
}
