import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { exchangeCodeForToken, getCurrentUser } from '@/lib/splitwise'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL!

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login', baseUrl))
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?splitwise=error&reason=missing_params', baseUrl),
      )
    }

    // Validate CSRF state
    const storedState = request.cookies.get('splitwise_oauth_state')?.value
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL('/settings?splitwise=error&reason=state_mismatch', baseUrl),
      )
    }

    // Exchange code for token
    let accessToken: string
    try {
      accessToken = await exchangeCodeForToken(code)
    } catch {
      return NextResponse.redirect(
        new URL('/settings?splitwise=error&reason=token_exchange_failed', baseUrl),
      )
    }

    // Get Splitwise user info
    let splitwiseUser
    try {
      splitwiseUser = await getCurrentUser(accessToken)
    } catch {
      return NextResponse.redirect(
        new URL('/settings?splitwise=error&reason=user_fetch_failed', baseUrl),
      )
    }

    // Save token and user ID
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        splitwiseToken: accessToken,
        splitwiseUserId: String(splitwiseUser.id),
      },
    })

    // Clear state cookie and redirect to settings
    const response = NextResponse.redirect(
      new URL('/settings?splitwise=connected', baseUrl),
    )
    response.cookies.delete('splitwise_oauth_state')

    return response
  } catch (error) {
    console.error('Splitwise OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?splitwise=error&reason=unexpected', baseUrl),
    )
  }
}
