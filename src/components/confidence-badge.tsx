'use client'

interface ConfidenceBadgeProps {
  level: 'HIGH' | 'MEDIUM' | 'LOW'
  reason?: string | null
}

const CONFIG = {
  HIGH: {
    label: 'High',
    className: 'badge-success',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'badge-warning',
  },
  LOW: {
    label: 'Low',
    className: 'bg-[var(--error)]/15 text-[var(--error)]',
  },
}

export function ConfidenceBadge({ level, reason }: ConfidenceBadgeProps) {
  const config = CONFIG[level]

  return (
    <span className={`badge ${config.className}`} title={reason || undefined}>
      {config.label}
    </span>
  )
}
