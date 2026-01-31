'use client'

import { Users } from 'lucide-react'
import { MemberChip } from './member-chip'

interface ItemSplitterProps {
  item: {
    id: string
    name: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }
  members: { id: string; name: string }[]
  /** Map of memberId → share weight (e.g. 2 means "2 parts") */
  memberShares: Map<string, number>
  onToggleMember: (itemId: string, memberId: string) => void
  onShareChange: (itemId: string, memberId: string, share: number) => void
  onSelectAll: (itemId: string) => void
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function ItemSplitter({
  item,
  members,
  memberShares,
  onToggleMember,
  onShareChange,
  onSelectAll,
}: ItemSplitterProps) {
  const assignedMembers = members.filter((m) => memberShares.has(m.id))
  const assignedCount = assignedMembers.length
  const allSelected = members.length > 0 && members.every((m) => memberShares.has(m.id))
  const totalShares = Array.from(memberShares.values()).reduce((s, v) => s + v, 0)

  // Check if any share is non-1 (custom ratio mode)
  const hasCustomRatios = Array.from(memberShares.values()).some((v) => v !== 1)

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
            selected={memberShares.has(member.id)}
            onClick={() => onToggleMember(item.id, member.id)}
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

      {/* Custom ratio editor — shown when 2+ members assigned */}
      {assignedCount >= 2 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-[var(--surface-hover)]/60">
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
      )}

      {/* Per-person breakdown */}
      {assignedCount > 0 ? (
        <div className="mt-2">
          {assignedCount === 1 ? (
            <p className="text-xs text-[var(--text-muted)]">
              ${formatCents(item.lineTotal)} to {assignedMembers[0].name}
            </p>
          ) : hasCustomRatios ? (
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
