import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFriends, SplitwiseError } from '@/lib/splitwise'

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

    const friends = await getFriends(user.splitwiseToken)

    return NextResponse.json({
      friends: friends.map((f) => ({
        id: f.id,
        first_name: f.first_name,
        last_name: f.last_name,
        email: f.email,
      })),
    })
  } catch (error) {
    if (error instanceof SplitwiseError && error.status === 401) {
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

    console.error('Failed to fetch Splitwise friends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 },
    )
  }
}
