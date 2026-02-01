'use client'

import { useState } from 'react'
import { Users, Percent, DollarSign } from 'lucide-react'
import { MemberChip } from './member-chip'

export type SplitMode = 'ratio' | 'manual'

interface ItemSplitterProps {
  item: {
    id: string
    name: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }
  members: { id: string; name: string }[]
  memberShares: Map<string, number>
  manualAmounts: Map<string, number>
  splitMode: SplitMode
  onToggleMember: (itemId: string, memberId: string) => void
  onShareChange: (itemId: string, memberId: string, share: number) => void
  onManualAmountChange: (itemId: string, memberId: string, cents: number) => void
  onModeChange: (itemId: string, mode: SplitMode) => void
  onSelectAll: (itemId: string) => void
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2)
}

function parseDollars(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num)) return 0
  return Math.round(num * 100)
}

export function ItemSplitter({
  item,
  members,
  memberShares,
  manualAmounts,
  splitMode,
  onToggleMember,
  onShareChange,
  onManualAmountChange,
  onModeChange,
  onSelectAll,
}: ItemSplitterProps) {
  // Track raw text input per member for manual mode so user can freely type
  const [manualInputs, setManualInputs] = useState<Map<string, string>>(() => {
    const m = new Map<string, string>()
    for (const [memberId, cents] of manualAmounts) {
      m.set(memberId, formatCents(cents))
    }
    return m
  })

  const isRatio = splitMode === 'ratio'
  const activeMap = isRatio ? memberShares : manualAmounts
  const assignedMembers = members.filter((m) => activeMap.has(m.id))
  const assignedCount = assignedMembers.length
  const allSelected = members.length > 0 && members.every((m) => activeMap.has(m.id))

  // Ratio stats
  const totalShares = Array.from(memberShares.values()).reduce((s, v) => s + v, 0)
  const hasCustomRatios = Array.from(memberShares.values()).some((v) => v !== 1)

  // Manual stats
  const manualSum = Array.from(manualAmounts.values()).reduce((s, v) => s + v, 0)
  const manualRemaining = item.lineTotal - manualSum
  const manualValid = assignedCount > 0 && manualRemaining === 0

  const handleManualBlur = (memberId: string, rawValue: string) => {
    const cents = parseDollars(rawValue)
    onManualAmountChange(item.id, memberId, cents)
    // Normalize display
    setManualInputs((prev) => {
      const next = new Map(prev)
      next.set(memberId, formatCents(cents))
      return next
    })
  }

  const handleManualInput = (memberId: string, value: string) => {
    setManualInputs((prev) => {
      const next = new Map(prev)
      next.set(memberId, value)
      return next
    })
  }

  // When toggling a member, also initialize/cleanup manual input
  const handleToggle = (memberId: string) => {
    onToggleMember(item.id, memberId)
    if (!activeMap.has(memberId)) {
      // Being added — initialize manual input to 0
      setManualInputs((prev) => {
        const next = new Map(prev)
        next.set(memberId, '0.00')
        return next
      })
    } else {
      // Being removed — cleanup
      setManualInputs((prev) => {
        const next = new Map(prev)
        next.delete(memberId)
        return next
      })
    }
  }

  return (
    <div className="px-4 py-4 border-b border-[var(--border)] last:border-b-0">
      {/* Item name + price */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm text-[var(--text-primary)] truncate block">
            {item.name}
          </span>
          {item.quantity > 1 && (
            <span className="text-xs text-[var(--text-muted)]">
              {item.quantity} x ${formatCents(item.unitPrice)}
            </span>
          )}
        </div>
        <span className="font-semibold text-sm tabular-nums text-[var(--text-primary)] ml-3">
          ${formatCents(item.lineTotal)}
        </span>
      </div>

      {/* Member chips */}
      <div className="flex flex-wrap items-center gap-2">
        {members.map((member) => (
          <MemberChip
            key={member.id}
            member={member}
            selected={activeMap.has(member.id)}
            onClick={() => handleToggle(member.id)}
          />
        ))}
        <button
          type="button"
          onClick={() => onSelectAll(item.id)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer
            ${allSelected
              ? 'bg-[var(--secondary)]/15 text-[var(--secondary)] border border-[var(--secondary)]/30'
              : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent'
            }`}
          title={allSelected ? 'Deselect all' : 'Select all'}
        >
          <Users className="h-3 w-3" />
          All
        </button>
      </div>

      {/* Mode toggle + split editor — shown when 2+ members assigned */}
      {assignedCount >= 2 && (
        <div className="mt-3">
          {/* Mode toggle */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center bg-[var(--surface-hover)] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => onModeChange(item.id, 'ratio')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer
                  ${isRatio
                    ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
              >
                <Percent className="h-3 w-3" />
                Ratio
              </button>
              <button
                type="button"
                onClick={() => onModeChange(item.id, 'manual')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer
                  ${!isRatio
                    ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
              >
                <DollarSign className="h-3 w-3" />
                Manual
              </button>
            </div>
          </div>

          {isRatio ? (
            /* Ratio editor */
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-[var(--surface-hover)]/60">
              <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mr-1">
                Ratio
              </span>
              {assignedMembers.map((member, idx) => {
                const share = memberShares.get(member.id) || 1
                return (
                  <div key={member.id} className="flex items-center gap-1">
                    {idx > 0 && (
                      <span className="text-[var(--text-muted)] text-xs font-medium mx-0.5">:</span>
                    )}
                    <span className="text-xs text-[var(--text-secondary)]">{member.name}</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={share}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        if (val >= 1 && val <= 99) {
                          onShareChange(item.id, member.id, val)
                        }
                      }}
                      className="w-10 h-6 text-center text-xs font-semibold rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30 tabular-nums"
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            /* Manual amount editor */
            <div className="p-2.5 rounded-lg bg-[var(--surface-hover)]/60 space-y-2">
              {assignedMembers.map((member) => {
                const rawVal = manualInputs.get(member.id) ?? '0.00'
                return (
                  <div key={member.id} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-secondary)] w-20 truncate">{member.name}</span>
                    <div className="relative flex-1 max-w-[120px]">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={rawVal}
                        onChange={(e) => handleManualInput(member.id, e.target.value)}
                        onBlur={(e) => handleManualBlur(member.id, e.target.value)}
                        className="w-full h-6 pl-5 pr-2 text-right text-xs font-semibold rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30 tabular-nums"
                      />
                    </div>
                  </div>
                )
              })}
              {/* Validation row */}
              <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border)]/50">
                <span className="text-[11px] text-[var(--text-muted)]">
                  Total: ${formatCents(manualSum)} / ${formatCents(item.lineTotal)}
                </span>
                {manualRemaining !== 0 && (
                  <span className={`text-[11px] font-medium ${manualRemaining > 0 ? 'text-[var(--warning)]' : 'text-[var(--error)]'}`}>
                    {manualRemaining > 0 ? `$${formatCents(manualRemaining)} left` : `$${formatCents(Math.abs(manualRemaining))} over`}
                  </span>
                )}
                {manualRemaining === 0 && (
                  <span className="text-[11px] font-medium text-[var(--success)]">Balanced</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Per-person breakdown */}
      {assignedCount > 0 ? (
        <div className="mt-2">
          {assignedCount === 1 ? (
            <p className="text-xs text-[var(--text-muted)]">
              ${formatCents(item.lineTotal)} to {assignedMembers[0].name}
            </p>
          ) : isRatio ? (
            hasCustomRatios ? (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {assignedMembers.map((member) => {
                  const share = memberShares.get(member.id) || 1
                  const amount = Math.floor((item.lineTotal * share) / totalShares)
                  return (
                    <span key={member.id} className="text-xs text-[var(--text-muted)]">
                      {member.name}: ${formatCents(amount)}
                    </span>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">
                ${formatCents(Math.floor(item.lineTotal / assignedCount))} per person
                {` (${assignedCount} people)`}
              </p>
            )
          ) : !manualValid ? (
            <p className="text-xs text-[var(--warning)]">
              Amounts must add up to ${formatCents(item.lineTotal)}
            </p>
          ) : (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {assignedMembers.map((member) => {
                const cents = manualAmounts.get(member.id) || 0
                return (
                  <span key={member.id} className="text-xs text-[var(--text-muted)]">
                    {member.name}: ${formatCents(cents)}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-[var(--warning)] mt-2">
          Assign to at least one person
        </p>
      )}
    </div>
  )
}
