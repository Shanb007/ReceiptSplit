import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ReceiptUploadForm } from './receipt-upload-form'
import { isLocalMode } from '@/lib/mode'

const FREE_SCAN_LIMIT = 5

export default async function NewReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  const { id } = await params

  const [group, user] = await Promise.all([
    prisma.group.findFirst({
      where: { id, userId: session.user.id },
      include: {
        members: {
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    isLocalMode
      ? null
      : prisma.user.findUnique({
          where: { id: session.user.id },
          select: { openaiApiKey: true, scanCount: true, scanResetDate: true },
        }),
  ])

  if (!group) {
    notFound()
  }

  // Calculate remaining scans
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

      <main className="flex-1 container mx-auto px-6 py-8 max-w-xl">
        <Link
          href={`/groups/${group.id}`}
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to {group.name}
        </Link>

        <ReceiptUploadForm
          group={JSON.parse(JSON.stringify(group))}
          scanLimit={FREE_SCAN_LIMIT}
          scansUsed={scansUsed}
          hasApiKey={hasApiKey}
          isLocalMode={isLocalMode}
        />
      </main>
    </div>
  )
}
