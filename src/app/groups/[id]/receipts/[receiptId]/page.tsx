import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/header'
import { ConfidenceBadge } from '@/components/confidence-badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Receipt as ReceiptIcon,
  Calendar,
  Store,
  User,
  Image as ImageIcon,
} from 'lucide-react'

function formatCents(cents: number | null): string {
  if (cents === null) return '-'
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(date: Date | null): string {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string; receiptId: string }>
}) {
  const session = await requireAuth()
  const { id, receiptId } = await params

  const receipt = await prisma.receipt.findFirst({
    where: {
      id: receiptId,
      groupId: id,
      group: { userId: session.user.id },
    },
    include: {
      lineItems: {
        orderBy: { sortOrder: 'asc' },
      },
      payer: true,
      group: {
        include: {
          members: { orderBy: { createdAt: 'asc' } },
        },
      },
    },
  })

  if (!receipt) {
    notFound()
  }

  const itemsSum = receipt.lineItems
    .filter((item) => item.isValid)
    .reduce((sum, item) => sum + item.lineTotal, 0)

  const reconciles = receipt.subtotal !== null
    ? Math.abs(itemsSum - receipt.subtotal) <= 1
    : true

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8 max-w-2xl">
        <Link
          href={`/groups/${id}`}
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to {receipt.group.name}
        </Link>

        {/* Receipt Header */}
        <div className="card p-8 mb-6 animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 flex items-center justify-center flex-shrink-0">
              <ReceiptIcon className="h-7 w-7 text-[var(--primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                {receipt.merchantName || 'Untitled Receipt'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                {receipt.receiptDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(receipt.receiptDate)}
                  </span>
                )}
                {receipt.payer && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Paid by {receipt.payer.name}
                  </span>
                )}
                {receipt.merchantName && (
                  <span className="flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5" />
                    {receipt.merchantName}
                  </span>
                )}
              </div>
            </div>
            <span className={`badge ${receipt.status === 'REVIEW' ? 'badge-warning' : 'badge-muted'}`}>
              {receipt.status}
            </span>
          </div>

          {/* Receipt image link */}
          {receipt.imageUrl && (
            <a
              href={receipt.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
            >
              <ImageIcon className="h-4 w-4" />
              View original receipt image
            </a>
          )}
        </div>

        {/* Line Items */}
        <div className="card mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h2 className="font-semibold text-[var(--text-primary)]">
              Extracted Items ({receipt.lineItems.length})
            </h2>
          </div>

          {receipt.lineItems.length === 0 ? (
            <div className="px-6 py-8 text-center text-[var(--text-muted)]">
              No items extracted
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {receipt.lineItems.map((item) => (
                <div
                  key={item.id}
                  className={`px-6 py-4 flex items-center justify-between gap-4 ${
                    !item.isValid ? 'opacity-50 line-through' : ''
                  } ${item.confidence === 'LOW' ? 'bg-[var(--error)]/5' : item.confidence === 'MEDIUM' ? 'bg-[var(--warning)]/5' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text-primary)] truncate">
                        {item.name}
                      </span>
                      {item.confidence !== 'HIGH' && (
                        <ConfidenceBadge
                          level={item.confidence}
                          reason={item.confidenceReason}
                        />
                      )}
                    </div>
                    {item.quantity > 1 && (
                      <span className="text-xs text-[var(--text-muted)]">
                        {item.quantity} x {formatCents(item.unitPrice)}
                      </span>
                    )}
                    {item.confidenceReason && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {item.confidenceReason}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums flex-shrink-0">
                    {formatCents(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">Totals</h2>

          {!reconciles && (
            <div className="bg-[var(--warning)]/10 text-[var(--warning)] px-4 py-3 rounded-xl text-sm mb-4">
              Items sum ({formatCents(itemsSum)}) doesn&apos;t match subtotal ({formatCents(receipt.subtotal)}). Some items may need correction.
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Items Sum</span>
              <span className={`font-medium tabular-nums ${!reconciles ? 'text-[var(--warning)]' : 'text-[var(--text-primary)]'}`}>
                {formatCents(itemsSum)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Subtotal</span>
              <span className="font-medium text-[var(--text-primary)] tabular-nums">
                {formatCents(receipt.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Tax</span>
              <span className="font-medium text-[var(--text-primary)] tabular-nums">
                {formatCents(receipt.tax)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Tip</span>
              <span className="font-medium text-[var(--text-primary)] tabular-nums">
                {formatCents(receipt.tip)}
              </span>
            </div>
            <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
              <span className="font-semibold text-[var(--text-primary)]">Total</span>
              <span className="font-bold text-lg text-[var(--text-primary)] tabular-nums">
                {formatCents(receipt.total)}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
