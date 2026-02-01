'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Receipt, LogOut, User, ChevronDown, Settings } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function Header() {
  const { data: session } = useSession()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="glass border-b border-[var(--border)] sticky top-0 z-50 animate-fade-in-down">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/groups" className="flex items-center gap-2.5 font-bold text-xl group">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-[#ff6b35]/20 group-hover:shadow-[#ff6b35]/30 transition-shadow">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <span className="text-[var(--text-primary)]">ReceiptSplit</span>
        </Link>

        {session?.user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
            >
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="h-8 w-8 rounded-full ring-2 ring-[var(--border)]"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium text-[var(--text-primary)]">
                {session.user.name?.split(' ')[0]}
              </span>
              <ChevronDown className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 card p-2 shadow-xl animate-fade-in-down">
                <div className="px-3 py-2 border-b border-[var(--border)] mb-2">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{session.user.name}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{session.user.email}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
