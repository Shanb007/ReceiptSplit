'use client'

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2)
}

interface PersonBreakdownProps {
  memberName: string
  isPayer: boolean
  itemsTotal: number
  taxShare: number
  tipShare: number
  finalAmount: number
}

export function PersonBreakdown({
  memberName,
  isPayer,
  itemsTotal,
  taxShare,
  tipShare,
  finalAmount,
}: PersonBreakdownProps) {
  return (
    <div className="card p-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {memberName.charAt(0).toUpperCase()}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-[var(--text-primary)] truncate">
            {memberName}
          </span>
          {isPayer && (
            <span className="badge badge-primary text-[10px] flex-shrink-0">PAYER</span>
          )}
        </div>
      </div>

      {/* Breakdown rows */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--text-secondary)]">Items</span>
          <span className="tabular-nums text-[var(--text-primary)]">
            ${formatCents(itemsTotal)}
          </span>
        </div>
        {taxShare > 0 && (
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Tax</span>
            <span className="tabular-nums text-[var(--text-primary)]">
              ${formatCents(taxShare)}
            </span>
          </div>
        )}
        {tipShare > 0 && (
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Tip</span>
            <span className="tabular-nums text-[var(--text-primary)]">
              ${formatCents(tipShare)}
            </span>
          </div>
        )}
      </div>

      {/* Divider + Total */}
      <div className="border-t border-[var(--border)] mt-3 pt-3 flex justify-between">
        <span className="font-semibold text-[var(--text-primary)]">Total</span>
        <span className="font-bold tabular-nums text-[var(--text-primary)]">
          ${formatCents(finalAmount)}
        </span>
      </div>
    </div>
  )
}
