'use client'

import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Receipt, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

const isLocalMode = process.env.NEXT_PUBLIC_MODE === 'local'

export default function LoginPage() {
  const [isAutoSigningIn] = useState(isLocalMode)

  useEffect(() => {
    if (isLocalMode) {
      signIn('credentials', { callbackUrl: '/groups' })
    }
  }, [])

  if (isAutoSigningIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[var(--primary)] mb-4" />
          <p className="text-[var(--text-secondary)]">Signing in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[var(--background)]">
      {/* Background decorations */}
      <div className="blob w-[500px] h-[500px] bg-[#ff6b35] top-[-150px] right-[-150px] fixed opacity-15" />
      <div className="blob w-[300px] h-[300px] bg-[#4ecdc4] bottom-[-50px] left-[-50px] fixed opacity-15" />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>

          {/* Logo & Title */}
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-[#ff6b35]/25 animate-float">
                <Receipt className="h-7 w-7 text-white" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Welcome back</h1>
            <p className="text-[var(--text-secondary)]">Sign in to continue splitting bills</p>
          </div>

          {/* Login Card */}
          <div className="card p-8">
            <button
              onClick={() => signIn('google', { callbackUrl: '/groups' })}
              className="w-full flex items-center justify-center gap-3 btn btn-secondary py-4 text-base group"
            >
              <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-[var(--surface)] text-[var(--text-muted)] uppercase tracking-wider">
                  Secure sign in
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-[var(--text-muted)]">
              We only access your name and email.
              <br />
              Your data stays private.
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-[var(--text-muted)] mt-8">
            By signing in, you agree to our{' '}
            <a href="#" className="text-[var(--primary)] hover:underline">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
