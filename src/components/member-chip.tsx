'use client'

import { Check } from 'lucide-react'

interface MemberChipProps {
  member: { id: string; name: string }
  selected: boolean
  onClick: () => void
}

export function MemberChip({ member, selected, onClick }: MemberChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer
        ${selected
          ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-md shadow-[var(--primary)]/20'
          : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:border-[var(--primary)] border border-transparent hover:bg-[var(--primary)]/5'
        }`}
    >
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0
        ${selected
            ? 'bg-white/20 text-white'
            : 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white'
          }`}
      >
        {member.name.charAt(0).toUpperCase()}
      </div>
      {member.name}
      {selected && <Check className="h-3 w-3" />}
    </button>
  )
}
