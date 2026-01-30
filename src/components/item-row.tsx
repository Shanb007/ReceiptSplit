'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Trash2, Check, X, EyeOff, Eye, Loader2 } from 'lucide-react'
import { ConfidenceBadge } from './confidence-badge'
import { ConfirmDialog } from './confirm-dialog'

export interface LineItemData {
  id: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  confidenceReason: string | null
  isValid: boolean
  sortOrder: number
}

interface ItemRowProps {
  item: LineItemData
  receiptId: string
  onItemUpdated: (item: LineItemData) => void
  onItemDeleted: (itemId: string) => void
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

export function ItemRow({ item, receiptId, onItemUpdated, onItemDeleted }: ItemRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editQty, setEditQty] = useState(String(item.quantity))
  const [editPrice, setEditPrice] = useState(formatCents(item.unitPrice))
  const [isSaving, setIsSaving] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && nameRef.current) {
      nameRef.current.focus()
      nameRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    const name = editName.trim()
    if (!name) {
      setError('Name cannot be empty')
      return
    }

    const quantity = parseInt(editQty) || 1
    const unitPrice = parseDollars(editPrice)
    const lineTotal = unitPrice * quantity

    setIsSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/receipts/${receiptId}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: item.id, name, quantity, unitPrice, lineTotal }],
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      onItemUpdated({ ...item, name, quantity, unitPrice, lineTotal })
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditName(item.name)
    setEditQty(String(item.quantity))
    setEditPrice(formatCents(item.unitPrice))
    setError('')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleToggleValid = async () => {
    setIsToggling(true)
    try {
      const res = await fetch(`/api/receipts/${receiptId}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: item.id, isValid: !item.isValid }],
        }),
      })
      if (!res.ok) throw new Error('Failed to update')
      onItemUpdated({ ...item, isValid: !item.isValid })
    } catch {
      setError('Failed to update')
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/receipts/${receiptId}/items/${item.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      onItemDeleted(item.id)
    } catch {
      setError('Failed to delete')
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const bgClass = item.confidence === 'LOW'
    ? 'bg-[var(--error)]/5'
    : item.confidence === 'MEDIUM'
    ? 'bg-[var(--warning)]/5'
    : ''

  if (isEditing) {
    return (
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-hover)] animate-scale-in">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              ref={nameRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              placeholder="Item name"
              className="input py-1.5 px-2 text-sm flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <label className="text-xs text-[var(--text-muted)]">Qty</label>
              <input
                type="number"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                min="1"
                className="input py-1.5 px-2 text-sm w-16 text-center"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs text-[var(--text-muted)]">Price $</label>
              <input
                type="text"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                placeholder="0.00"
                className="input py-1.5 px-2 text-sm w-24 text-right tabular-nums"
              />
            </div>
            <div className="flex items-center gap-1 ml-auto">
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--success)] hover:bg-[var(--success)]/10 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          {error && (
            <p className="text-[var(--error)] text-xs">{error}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={`group/item px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-3 transition-colors hover:bg-[var(--surface-hover)] ${bgClass} ${
          !item.isValid ? 'opacity-50' : ''
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm text-[var(--text-primary)] truncate ${!item.isValid ? 'line-through' : ''}`}>
              {item.name}
            </span>
            {item.confidence !== 'HIGH' && (
              <ConfidenceBadge level={item.confidence} reason={item.confidenceReason} />
            )}
          </div>
          {item.quantity > 1 && (
            <span className="text-xs text-[var(--text-muted)]">
              {item.quantity} x ${formatCents(item.unitPrice)}
            </span>
          )}
          {item.confidenceReason && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.confidenceReason}</p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className={`font-semibold text-sm tabular-nums flex-shrink-0 mr-1 ${!item.isValid ? 'line-through' : ''} text-[var(--text-primary)]`}>
            ${formatCents(item.lineTotal)}
          </span>

          {/* Actions — visible on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
              title="Edit item"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleToggleValid}
              disabled={isToggling}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--warning)] hover:bg-[var(--warning)]/10 transition-colors"
              title={item.isValid ? 'Mark as invalid' : 'Mark as valid'}
            >
              {isToggling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : item.isValid ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
              title="Delete item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Item"
        description={`Remove "${item.name}" from this receipt?`}
        confirmLabel="Delete"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}
