import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Plus, Users, Receipt, Calendar, DollarSign, ChevronRight, Crown, Camera } from 'lucide-react'
import type { Member, Receipt as ReceiptModel } from '@/types'

function formatCents(cents: number | null): string {
  if (cents === null) return '-'
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function getStatusConfig(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pending', className: 'badge-muted' },
    PROCESSING: { label: 'Processing', className: 'bg-blue-100 text-blue-700' },
    REVIEW: { label: 'Review', className: 'badge-warning' },
    SPLITTING: { label: 'Splitting', className: 'bg-purple-100 text-purple-700' },
    SETTLED: { label: 'Settled', className: 'badge-success' },
    EXPORTED: { label: 'Exported', className: 'badge-success' },
  }
  return statusMap[status] || statusMap.PENDING
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  const { id } = await params

  const group = await prisma.group.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      members: {
        orderBy: { createdAt: 'asc' },
      },
      receipts: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!group) {
    notFound()
  }

  const payer = group.members.find((m: Member) => m.isPayer)

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to groups
        </Link>

        {/* Group Header Card */}
        <div className="card p-8 mb-8 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{group.name}</h1>
                <p className="text-[var(--text-secondary)] text-sm">
                  Created {formatDate(group.createdAt)}
                </p>
              </div>
            </div>

            {payer && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent)]/10">
                <Crown className="h-4 w-4 text-[#b8860b]" />
                <span className="text-sm font-medium text-[#7a5a00]">{payer.name} paid</span>
              </div>
            )}
          </div>

          {/* Members */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">Members</h3>
            <div className="flex flex-wrap gap-2">
              {group.members.map((member: Member) => (
                <div
                  key={member.id}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    member.isPayer
                      ? 'bg-gradient-to-r from-[var(--accent)]/30 to-[var(--accent)]/20 text-[#7a5a00]'
                      : 'bg-[var(--surface-hover)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    member.isPayer
                      ? 'bg-[var(--accent)] text-[#7a5a00]'
                      : 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white'
                  }`}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  {member.name}
                  {member.isPayer && <Crown className="h-3.5 w-3.5" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Receipts Section */}
        <div className="flex items-center justify-between mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Receipts</h2>
            <p className="text-[var(--text-secondary)] text-sm mt-0.5">
              {group.receipts.length === 0 ? 'No receipts yet' : `${group.receipts.length} receipt${group.receipts.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <Link href={`/groups/${group.id}/receipts/new`} className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Add Receipt
          </Link>
        </div>

        {group.receipts.length === 0 ? (
          <div className="card p-12 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--secondary)]/10 to-[var(--secondary)]/5 flex items-center justify-center mx-auto mb-6">
              <Camera className="h-10 w-10 text-[var(--secondary)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No receipts yet</h3>
            <p className="text-[var(--text-secondary)] mb-8 max-w-sm mx-auto">
              Upload a receipt photo and let AI extract all the items for splitting
            </p>
            <Link href={`/groups/${group.id}/receipts/new`} className="btn btn-primary">
              <Camera className="h-4 w-4" />
              Upload First Receipt
            </Link>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {group.receipts.map((receipt: ReceiptModel) => {
              const statusConfig = getStatusConfig(receipt.status)
              return (
                <Link
                  key={receipt.id}
                  href={`/groups/${group.id}/receipts/${receipt.id}`}
                  className="card card-interactive p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 flex items-center justify-center">
                      <Receipt className="h-6 w-6 text-[var(--primary)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {receipt.merchantName || 'Untitled Receipt'}
                        </span>
                        <span className={`badge ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                        {receipt.receiptDate && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(receipt.receiptDate)}
                          </span>
                        )}
                        {receipt.total && (
                          <span className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5" />
                            {formatCents(receipt.total)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
