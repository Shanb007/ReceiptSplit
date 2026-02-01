'use client'

import { ArrowRight, AlertTriangle } from 'lucide-react'

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2)
}

interface SettlementEntry {
  memberId: string
  memberName: string
  finalAmount: number // cents
}

interface SettlementSummaryProps {
  settlements: SettlementEntry[]
  payerId: string | null
  payerName: string | null
}

export function SettlementSummary({
  settlements,
  payerId,
  payerName,
}: SettlementSummaryProps) {
  if (!payerId || !payerName) {
    return (
      <div className="card p-5 animate-fade-in-up">
        <div className="flex items-center gap-2 text-[var(--warning)]">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">No payer set — cannot determine who owes whom.</span>
        </div>
      </div>
    )
  }

  const transfers = settlements.filter(
    (s) => s.memberId !== payerId && s.finalAmount > 0,
  )

  const totalReimbursement = transfers.reduce(
    (sum, t) => sum + t.finalAmount,
    0,
  )

  const payerSettlement = settlements.find((s) => s.memberId === payerId)

  if (transfers.length === 0) {
    return (
      <div className="card p-5 animate-fade-in-up">
        <h2 className="font-semibold text-[var(--text-primary)] mb-3">
          Settlement Summary
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          No transfers needed — only the payer has charges.
        </p>
      </div>
    )
  }

  return (
    <div className="card p-5 animate-fade-in-up">
      <h2 className="font-semibold text-[var(--text-primary)] mb-4">
        Who Owes Whom
      </h2>

      <div className="space-y-3">
        {transfers.map((t) => (
          <div
            key={t.memberId}
            className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-hover)] transition-colors"
          >
            {/* From member */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--error)]/20 to-[var(--error)]/5 flex items-center justify-center text-[var(--error)] text-xs font-semibold flex-shrink-0">
                {t.memberName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                {t.memberName}
              </span>
            </div>

            {/* Arrow */}
            <ArrowRight className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />

            {/* To payer */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--success)]/20 to-[var(--success)]/5 flex items-center justify-center text-[var(--success)] text-xs font-semibold flex-shrink-0">
                {payerName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                {payerName}
              </span>
            </div>

            {/* Amount */}
            <span className="font-bold text-sm tabular-nums text-[var(--text-primary)] flex-shrink-0">
              ${formatCents(t.finalAmount)}
            </span>
          </div>
        ))}
      </div>

      {/* Summary footer */}
      <div className="border-t border-[var(--border)] mt-4 pt-4 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">
            Total to reimburse {payerName}
          </span>
          <span className="font-bold tabular-nums text-[var(--text-primary)]">
            ${formatCents(totalReimbursement)}
          </span>
        </div>
        {payerSettlement && payerSettlement.finalAmount > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)]">
              {payerName}&apos;s own share
            </span>
            <span className="tabular-nums text-[var(--text-muted)]">
              ${formatCents(payerSettlement.finalAmount)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
