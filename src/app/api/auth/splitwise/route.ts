import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAuthorizationUrl } from '@/lib/splitwise'
import crypto from 'crypto'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL))
    }

    const state = crypto.randomUUID()
    const authUrl = getAuthorizationUrl(state)

    const response = NextResponse.redirect(authUrl)

    // Store state in HttpOnly cookie for CSRF validation
    response.cookies.set('splitwise_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Failed to initiate Splitwise OAuth:', error)
    return NextResponse.redirect(
      new URL('/settings?splitwise=error&reason=init_failed', process.env.NEXTAUTH_URL!),
    )
  }
}
