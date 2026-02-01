'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Receipt as ReceiptIcon,
  Calendar,
  User,
  Store,
  Calculator,
  Loader2,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Settings,
} from 'lucide-react'
import { PersonBreakdown } from '@/components/person-breakdown'
import { SettlementSummary } from '@/components/settlement-summary'
import { SplitwiseMemberMapper } from '@/components/splitwise-member-mapper'

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface SettlementData {
  id: string
  receiptId: string
  memberId: string
  itemsTotal: number
  taxShare: number
  tipShare: number
  finalAmount: number
  member: { id: string; name: string }
}

interface MemberData {
  id: string
  name: string
  splitwiseUserId: string | null
}

interface ReceiptData {
  id: string
  groupId: string
  merchantName: string | null
  receiptDate: string | null
  subtotal: number | null
  tax: number | null
  tip: number | null
  total: number | null
  status: string
  payerId: string | null
  payer: { id: string; name: string } | null
  group: {
    id: string
    name: string
    members: MemberData[]
  }
}

export function SettleClient({
  receipt: initialReceipt,
  initialSettlements,
  splitwiseConnected,
}: {
  receipt: ReceiptData
  initialSettlements: SettlementData[]
  splitwiseConnected: boolean
}) {
  const [receipt, setReceipt] = useState(initialReceipt)
  const [settlements, setSettlements] = useState(initialSettlements)
  const [isComputing, setIsComputing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [showMapper, setShowMapper] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(
    initialReceipt.status === 'EXPORTED',
  )
  const [membersState, setMembersState] = useState<MemberData[]>(
    initialReceipt.group.members,
  )
  const [splitwiseGroupId, setSplitwiseGroupId] = useState<number | null>(
    null,
  )

  const hasSettlements = settlements.length > 0
  const grandTotal = settlements.reduce((sum, s) => sum + s.finalAmount, 0)

  const handleCompute = async () => {
    setIsComputing(true)
    setError('')
    try {
      const res = await fetch(`/api/receipts/${receipt.id}/settle`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to compute settlement')
      }
      const data = await res.json()
      setSettlements(data.settlements)
      setReceipt((prev) => ({ ...prev, status: 'SETTLED' }))
      setExportSuccess(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compute')
    } finally {
      setIsComputing(false)
    }
  }

  const handleExport = async () => {
    setError('')

    // Pre-check: Splitwise connected?
    if (!splitwiseConnected) {
      setError(
        'Splitwise is not connected. Please connect in Settings first.',
      )
      return
    }

    // Pre-check: all settlement members mapped?
    const settlementMemberIds = settlements.map((s) => s.memberId)
    const unmapped = membersState
      .filter(
        (m) =>
          settlementMemberIds.includes(m.id) && !m.splitwiseUserId,
      )
      .map((m) => m.name)

    if (unmapped.length > 0) {
      setShowMapper(true)
      return
    }

    // Export
    setIsExporting(true)
    try {
      const res = await fetch(
        `/api/receipts/${receipt.id}/export/splitwise`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            splitwiseGroupId ? { group_id: splitwiseGroupId } : {},
          ),
        },
      )
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Export failed')
      }
      setExportSuccess(true)
      setReceipt((prev) => ({ ...prev, status: 'EXPORTED' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleMappingComplete = (
    updated: { memberId: string; memberName: string; splitwiseUserId: string | null }[],
    swGroupId: number,
  ) => {
    setMembersState((prev) =>
      prev.map((m) => {
        const u = updated.find((u) => u.memberId === m.id)
        return u ? { ...m, splitwiseUserId: u.splitwiseUserId } : m
      }),
    )
    setSplitwiseGroupId(swGroupId)
    setShowMapper(false)
  }

  const statusBadge = () => {
    if (exportSuccess || receipt.status === 'EXPORTED') {
      return <span className="badge badge-primary">EXPORTED</span>
    }
    if (hasSettlements) {
      return <span className="badge badge-success">SETTLED</span>
    }
    return <span className="badge badge-warning">SPLITTING</span>
  }

  return (
    <>
      {/* Receipt Header */}
      <div className="card p-6 mb-6 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 flex items-center justify-center flex-shrink-0">
            <ReceiptIcon className="h-6 w-6 text-[var(--primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Settlement
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {receipt.merchantName || 'Untitled Receipt'}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
              {receipt.receiptDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(receipt.receiptDate)}
                </span>
              )}
              {receipt.payer && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Paid by {receipt.payer.name}
                </span>
              )}
              {receipt.merchantName && (
                <span className="flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  {receipt.merchantName}
                </span>
              )}
              {receipt.total != null && (
                <span className="flex items-center gap-1">
                  <Calculator className="h-3 w-3" />
                  Total: ${formatCents(receipt.total)}
                </span>
              )}
            </div>
          </div>
          {statusBadge()}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-[var(--error)] mb-4 p-3 rounded-lg bg-[var(--error)]/5 animate-fade-in-up">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          {error.includes('Settings') && (
            <Link
              href="/settings"
              className="text-[var(--primary)] hover:underline flex-shrink-0 flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Settings
            </Link>
          )}
        </div>
      )}

      {/* No settlements — show compute button */}
      {!hasSettlements && (
        <div
          className="card p-8 text-center animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 flex items-center justify-center mx-auto mb-4">
            <Calculator className="h-8 w-8 text-[var(--primary)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Ready to Settle
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md mx-auto">
            Compute each person&apos;s share based on item assignments, tax,
            and tip allocations.
          </p>
          <button
            type="button"
            onClick={handleCompute}
            disabled={isComputing}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isComputing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4" />
            )}
            {isComputing ? 'Computing...' : 'Compute Settlement'}
          </button>
        </div>
      )}

      {/* Settlements exist — show results */}
      {hasSettlements && (
        <>
          {/* Per-Person Breakdown */}
          <div
            className="mb-6 animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <h2 className="font-semibold text-[var(--text-primary)] mb-3">
              Per-Person Breakdown
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {settlements.map((s) => (
                <PersonBreakdown
                  key={s.memberId}
                  memberName={s.member.name}
                  isPayer={s.memberId === receipt.payerId}
                  itemsTotal={s.itemsTotal}
                  taxShare={s.taxShare}
                  tipShare={s.tipShare}
                  finalAmount={s.finalAmount}
                />
              ))}
            </div>

            {/* Grand total */}
            <div className="card p-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[var(--text-primary)]">
                  Grand Total
                </span>
                <span className="font-bold text-base tabular-nums text-[var(--text-primary)]">
                  ${formatCents(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Settlement Summary (who owes whom) */}
          <div
            className="mb-6 animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            <SettlementSummary
              settlements={settlements.map((s) => ({
                memberId: s.memberId,
                memberName: s.member.name,
                finalAmount: s.finalAmount,
              }))}
              payerId={receipt.payerId}
              payerName={receipt.payer?.name || null}
            />
          </div>

          {/* Footer actions */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <button
              type="button"
              onClick={handleCompute}
              disabled={isComputing}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isComputing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isComputing ? 'Re-computing...' : 'Re-compute Settlement'}
            </button>

            {/* Export to Splitwise */}
            {exportSuccess ? (
              <span className="btn btn-secondary cursor-default">
                <CheckCircle className="h-4 w-4 text-[var(--success)]" />
                Exported to Splitwise
              </span>
            ) : (
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export to Splitwise'}
              </button>
            )}

            <Link
              href={`/groups/${receipt.group.id}`}
              className="btn btn-primary"
            >
              <CheckCircle className="h-4 w-4" />
              Back to Group
            </Link>
          </div>
        </>
      )}

      {/* Splitwise Member Mapper Modal */}
      <SplitwiseMemberMapper
        open={showMapper}
        groupId={receipt.group.id}
        members={membersState.map((m) => ({
          memberId: m.id,
          memberName: m.name,
          splitwiseUserId: m.splitwiseUserId,
        }))}
        onClose={() => setShowMapper(false)}
        onMappingComplete={handleMappingComplete}
      />
    </>
  )
}
