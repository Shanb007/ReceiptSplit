import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { openaiApiKey: true },
    })

    return NextResponse.json({ hasKey: !!user?.openaiApiKey })
  } catch (error) {
    console.error('Failed to check API key:', error)
    return NextResponse.json(
      { error: 'Failed to check API key' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { apiKey } = body

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 },
      )
    }

    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json(
        { error: 'Invalid API key format. OpenAI keys start with "sk-".' },
        { status: 400 },
      )
    }

    // Validate the key works by making a minimal API call
    try {
      const { default: OpenAI } = await import('openai')
      const client = new OpenAI({ apiKey })
      await client.models.list()
    } catch {
      return NextResponse.json(
        { error: 'Invalid API key. Please check and try again.' },
        { status: 400 },
      )
    }

    // Encrypt and save
    const encrypted = encrypt(apiKey)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { openaiApiKey: encrypted },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save API key:', error)
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { openaiApiKey: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove API key:', error)
    return NextResponse.json(
      { error: 'Failed to remove API key' },
      { status: 500 },
    )
  }
}
