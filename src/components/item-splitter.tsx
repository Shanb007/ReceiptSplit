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
  assignedMemberIds: Set<string>
  onToggleMember: (itemId: string, memberId: string) => void
  onSelectAll: (itemId: string) => void
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function ItemSplitter({
  item,
  members,
  assignedMemberIds,
  onToggleMember,
  onSelectAll,
}: ItemSplitterProps) {
  const assignedCount = assignedMemberIds.size
  const allSelected = members.length > 0 && members.every((m) => assignedMemberIds.has(m.id))
  const perPerson = assignedCount > 0 ? Math.floor(item.lineTotal / assignedCount) : 0

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
            selected={assignedMemberIds.has(member.id)}
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

      {/* Per-person breakdown */}
      {assignedCount > 0 ? (
        <p className="text-xs text-[var(--text-muted)] mt-2">
          ${formatCents(perPerson)} per person
          {assignedCount > 1 && ` (${assignedCount} people)`}
        </p>
      ) : (
        <p className="text-xs text-[var(--warning)] mt-2">
          Assign to at least one person
        </p>
      )}
    </div>
  )
}
