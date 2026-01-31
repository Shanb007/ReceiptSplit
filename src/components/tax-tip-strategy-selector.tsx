'use client'

import { Percent, Equal } from 'lucide-react'

type Strategy = 'PROPORTIONAL' | 'EQUAL'

interface TaxTipStrategySelectorProps {
  taxStrategy: Strategy
  tipStrategy: Strategy
  onTaxStrategyChange: (strategy: Strategy) => void
  onTipStrategyChange: (strategy: Strategy) => void
  taxAmount: number | null
  tipAmount: number | null
  disabled?: boolean
}

function formatCents(cents: number | null): string {
  if (cents === null || cents === undefined) return '$0.00'
  return `$${(cents / 100).toFixed(2)}`
}

function StrategyRow({
  label,
  amount,
  value,
  onChange,
  disabled,
}: {
  label: string
  amount: string
  value: Strategy
  onChange: (s: Strategy) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
        <span className="text-sm text-[var(--text-muted)] ml-2">{amount}</span>
      </div>
      <div className="flex items-center bg-[var(--surface-hover)] rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => onChange('PROPORTIONAL')}
          disabled={disabled}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer
            ${value === 'PROPORTIONAL'
              ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
        >
          <Percent className="h-3 w-3" />
          Proportional
        </button>
        <button
          type="button"
          onClick={() => onChange('EQUAL')}
          disabled={disabled}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer
            ${value === 'EQUAL'
              ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
        >
          <Equal className="h-3 w-3" />
          Equal
        </button>
      </div>
    </div>
  )
}

export function TaxTipStrategySelector({
  taxStrategy,
  tipStrategy,
  onTaxStrategyChange,
  onTipStrategyChange,
  taxAmount,
  tipAmount,
  disabled,
}: TaxTipStrategySelectorProps) {
  return (
    <div className="divide-y divide-[var(--border)]">
      <StrategyRow
        label="Tax"
        amount={formatCents(taxAmount)}
        value={taxStrategy}
        onChange={onTaxStrategyChange}
        disabled={disabled}
      />
      {(tipAmount !== null && tipAmount > 0) && (
        <StrategyRow
          label="Tip"
          amount={formatCents(tipAmount)}
          value={tipStrategy}
          onChange={onTipStrategyChange}
          disabled={disabled}
        />
      )}
    </div>
  )
}
