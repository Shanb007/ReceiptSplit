import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Plus, Users, Receipt, Calendar, DollarSign, ChevronRight, Crown } from 'lucide-react'
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

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pending', className: 'bg-gray-100 text-gray-700' },
    PROCESSING: { label: 'Processing', className: 'bg-blue-100 text-blue-700' },
    REVIEW: { label: 'Review', className: 'bg-yellow-100 text-yellow-700' },
    SPLITTING: { label: 'Splitting', className: 'bg-purple-100 text-purple-700' },
    SETTLED: { label: 'Settled', className: 'bg-emerald-100 text-emerald-700' },
    EXPORTED: { label: 'Exported', className: 'bg-green-100 text-green-700' },
  }
  const config = statusMap[status] || statusMap.PENDING
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
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
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/groups"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to groups
        </Link>

        {/* Group Header */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">{group.name}</h1>

          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-500">Members</span>
              <div className="flex items-center gap-2 mt-1">
                <Users className="h-4 w-4 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {group.members.map((member: Member) => (
                    <span
                      key={member.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                        member.isPayer
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {member.isPayer && <Crown className="h-3 w-3" />}
                      {member.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {payer && (
              <div>
                <span className="text-gray-500">Paid by</span>
                <p className="font-medium mt-1">{payer.name}</p>
              </div>
            )}

            <div>
              <span className="text-gray-500">Created</span>
              <p className="mt-1">{formatDate(group.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Receipts Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Receipts</h2>
          <Link
            href={`/groups/${group.id}/receipts/new`}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Receipt
          </Link>
        </div>

        {group.receipts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts yet</h3>
            <p className="text-gray-500 mb-6">
              Upload a receipt to start splitting
            </p>
            <Link
              href={`/groups/${group.id}/receipts/new`}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Upload Receipt
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {group.receipts.map((receipt: ReceiptModel) => (
              <Link
                key={receipt.id}
                href={`/groups/${group.id}/receipts/${receipt.id}`}
                className="flex items-center justify-between bg-white rounded-xl border p-4 hover:border-emerald-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">
                        {receipt.merchantName || 'Untitled Receipt'}
                      </span>
                      {getStatusBadge(receipt.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      {receipt.receiptDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(receipt.receiptDate)}
                        </span>
                      )}
                      {receipt.total && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCents(receipt.total)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
