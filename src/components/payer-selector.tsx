'use client'

import { ChevronDown } from 'lucide-react'

interface PayerSelectorProps {
  members: { id: string; name: string }[]
  selectedPayerId: string
  onChange: (payerId: string) => void
  disabled?: boolean
}

export function PayerSelector({
  members,
  selectedPayerId,
  onChange,
  disabled = false,
}: PayerSelectorProps) {
  return (
    <div className="relative">
      <select
        value={selectedPayerId}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="input appearance-none pr-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Select who paid...</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)] pointer-events-none" />
    </div>
  )
}
