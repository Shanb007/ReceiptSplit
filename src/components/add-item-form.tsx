'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import type { LineItemData } from './item-row'

interface AddItemFormProps {
  receiptId: string
  onItemAdded: (item: LineItemData) => void
}

function parseDollars(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num)) return 0
  return Math.round(num * 100)
}

export function AddItemForm({ receiptId, onItemAdded }: AddItemFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Item name is required')
      return
    }

    const unitPrice = parseDollars(price)
    if (unitPrice <= 0) {
      setError('Price must be greater than 0')
      return
    }

    const qty = parseInt(quantity) || 1
    const lineTotal = unitPrice * qty

    setIsAdding(true)
    setError('')
    try {
      const res = await fetch(`/api/receipts/${receiptId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, quantity: qty, unitPrice, lineTotal }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add item')
      }
      const item = await res.json()
      onItemAdded(item)
      setName('')
      setPrice('')
      setQuantity('1')
      setIsOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setIsAdding(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-3 border-t border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/3 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add item manually
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-[var(--border)] px-4 py-3 bg-[var(--surface-hover)] animate-scale-in">
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          disabled={isAdding}
          autoFocus
          className="input py-1.5 px-2 text-sm"
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <label className="text-xs text-[var(--text-muted)]">Qty</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={isAdding}
              min="1"
              className="input py-1.5 px-2 text-sm w-16 text-center"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-[var(--text-muted)]">Price $</label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={isAdding}
              placeholder="0.00"
              className="input py-1.5 px-2 text-sm w-24 text-right tabular-nums"
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
            ) : (
              <>
                <button
                  type="submit"
                  className="btn btn-primary py-1.5 px-3 text-xs"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setError('') }}
                  className="btn btn-secondary py-1.5 px-3 text-xs"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
        {error && <p className="text-[var(--error)] text-xs">{error}</p>}
      </div>
    </form>
  )
}
