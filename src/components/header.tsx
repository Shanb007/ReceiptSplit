'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Receipt, LogOut, User } from 'lucide-react'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Receipt className="h-6 w-6 text-emerald-600" />
          <span>ReceiptSplit</span>
        </Link>

        {session?.user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <User className="h-8 w-8 p-1 rounded-full bg-gray-100" />
              )}
              <span className="hidden sm:inline">{session.user.name}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
