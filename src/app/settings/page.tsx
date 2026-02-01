import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SettingsClient } from './settings-client'
import { getCurrentUser } from '@/lib/splitwise'

export default async function SettingsPage() {
  const session = await requireAuth()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      splitwiseToken: true,
      splitwiseUserId: true,
      openaiApiKey: true,
      scanCount: true,
      scanResetDate: true,
    },
  })

  let splitwiseConnected = false
  let splitwiseUserName: string | null = null
  let splitwiseEmail: string | null = null

  if (user?.splitwiseToken) {
    try {
      const swUser = await getCurrentUser(user.splitwiseToken)
      splitwiseConnected = true
      splitwiseUserName = `${swUser.first_name} ${swUser.last_name}`.trim()
      splitwiseEmail = swUser.email
    } catch {
      // Token expired or revoked — treat as disconnected
      splitwiseConnected = false
    }
  }

  // Compute scan usage
  const hasApiKey = !!user?.openaiApiKey
  let scansUsed = user?.scanCount ?? 0
  if (user?.scanResetDate) {
    const now = new Date()
    const resetDate = new Date(user.scanResetDate)
    if (
      resetDate.getMonth() !== now.getMonth() ||
      resetDate.getFullYear() !== now.getFullYear()
    ) {
      scansUsed = 0
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8 max-w-2xl">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Groups
        </Link>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
          Settings
        </h1>

        <SettingsClient
          splitwiseConnected={splitwiseConnected}
          splitwiseUserName={splitwiseUserName}
          splitwiseEmail={splitwiseEmail}
          hasApiKey={hasApiKey}
          scansUsed={scansUsed}
          scanLimit={5}
        />
      </main>
    </div>
  )
}
