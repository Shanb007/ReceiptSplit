'use client'

import { useState } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'

interface TotalsPanelProps {
  itemsSum: number
  subtotal: number | null
  tax: number | null
  tip: number | null
  total: number | null
  receiptId: string
  onTotalsUpdated: (totals: { subtotal?: number; tax?: number; tip?: number; total?: number }) => void
}

function formatCents(cents: number | null): string {
  if (cents === null) return '-'
  return `$${(cents / 100).toFixed(2)}`
}

function parseDollars(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, '')
  if (cleaned === '') return null
  const num = parseFloat(cleaned)
  if (isNaN(num)) return null
  return Math.round(num * 100)
}

export function TotalsPanel({
  itemsSum,
  subtotal,
  tax,
  tip,
  total,
  receiptId,
  onTotalsUpdated,
}: TotalsPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editSubtotal, setEditSubtotal] = useState(subtotal !== null ? (subtotal / 100).toFixed(2) : '')
  const [editTax, setEditTax] = useState(tax !== null ? (tax / 100).toFixed(2) : '')
  const [editTip, setEditTip] = useState(tip !== null ? (tip / 100).toFixed(2) : '')
  const [editTotal, setEditTotal] = useState(total !== null ? (total / 100).toFixed(2) : '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const reconciles = subtotal !== null ? Math.abs(itemsSum - subtotal) <= 1 : true

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      const updates: Record<string, number | undefined> = {}
      const newSubtotal = parseDollars(editSubtotal)
      const newTax = parseDollars(editTax)
      const newTip = parseDollars(editTip)
      const newTotal = parseDollars(editTotal)

      if (newSubtotal !== null) updates.subtotal = newSubtotal
      if (newTax !== null) updates.tax = newTax
      if (newTip !== null) updates.tip = newTip
      if (newTotal !== null) updates.total = newTotal

      const res = await fetch(`/api/receipts/${receiptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update totals')

      onTotalsUpdated(updates)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditSubtotal(subtotal !== null ? (subtotal / 100).toFixed(2) : '')
    setEditTax(tax !== null ? (tax / 100).toFixed(2) : '')
    setEditTip(tip !== null ? (tip / 100).toFixed(2) : '')
    setEditTotal(total !== null ? (total / 100).toFixed(2) : '')
    setError('')
    setIsEditing(false)
  }

  return (
    <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[var(--text-primary)]">Totals</h2>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
            title="Edit totals"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--success)] hover:bg-[var(--success)]/10 transition-colors"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!reconciles && (
        <div className="bg-[var(--warning)]/10 text-[var(--warning)] px-4 py-3 rounded-xl text-sm mb-4">
          Items sum ({formatCents(itemsSum)}) doesn&apos;t match subtotal ({formatCents(subtotal)}). Some items may need correction.
        </div>
      )}

      {error && (
        <div className="bg-[var(--error)]/10 text-[var(--error)] px-4 py-3 rounded-xl text-sm mb-4 animate-scale-in">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <TotalRow label="Items Sum" value={formatCents(itemsSum)} warn={!reconciles} />

        {isEditing ? (
          <>
            <EditRow label="Subtotal" value={editSubtotal} onChange={setEditSubtotal} disabled={isSaving} />
            <EditRow label="Tax" value={editTax} onChange={setEditTax} disabled={isSaving} />
            <EditRow label="Tip" value={editTip} onChange={setEditTip} disabled={isSaving} />
            <EditRow label="Total" value={editTotal} onChange={setEditTotal} disabled={isSaving} bold />
          </>
        ) : (
          <>
            <TotalRow label="Subtotal" value={formatCents(subtotal)} />
            <TotalRow label="Tax" value={formatCents(tax)} />
            <TotalRow label="Tip" value={formatCents(tip)} />
            <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
              <span className="font-semibold text-[var(--text-primary)]">Total</span>
              <span className="font-bold text-lg text-[var(--text-primary)] tabular-nums">
                {formatCents(total)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TotalRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={`font-medium tabular-nums ${warn ? 'text-[var(--warning)]' : 'text-[var(--text-primary)]'}`}>
        {value}
      </span>
    </div>
  )
}

function EditRow({
  label,
  value,
  onChange,
  disabled,
  bold,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
  bold?: boolean
}) {
  return (
    <div className={`flex items-center justify-between text-sm ${bold ? 'border-t border-[var(--border)] pt-3' : ''}`}>
      <span className={bold ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
        {label}
      </span>
      <div className="flex items-center gap-1">
        <span className="text-[var(--text-muted)]">$</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="0.00"
          className="input py-1 px-2 text-sm w-24 text-right tabular-nums"
        />
      </div>
    </div>
  )
}
