'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Receipt as ReceiptIcon,
  Calendar,
  User,
  Store,
  Image as ImageIcon,
} from 'lucide-react'
import { ItemRow, type LineItemData } from '@/components/item-row'
import { AddItemForm } from '@/components/add-item-form'
import { TotalsPanel } from '@/components/totals-panel'

interface PayerData {
  id: string
  name: string
}

interface ReceiptData {
  id: string
  groupId: string
  merchantName: string | null
  receiptDate: string | null
  imageUrl: string | null
  subtotal: number | null
  tax: number | null
  tip: number | null
  total: number | null
  status: string
  lineItems: LineItemData[]
  payer: PayerData | null
  group: {
    id: string
    name: string
    members: { id: string; name: string }[]
  }
}

function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function ReceiptReviewClient({ receipt: initialReceipt }: { receipt: ReceiptData }) {
  const [receipt, setReceipt] = useState(initialReceipt)

  const validItems = receipt.lineItems.filter((item) => item.isValid)
  const itemsSum = validItems.reduce((sum, item) => sum + item.lineTotal, 0)

  const handleItemUpdated = (updatedItem: LineItemData) => {
    setReceipt((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      ),
    }))
  }

  const handleItemDeleted = (itemId: string) => {
    setReceipt((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((item) => item.id !== itemId),
    }))
  }

  const handleItemAdded = (newItem: LineItemData) => {
    setReceipt((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }))
  }

  const handleTotalsUpdated = (totals: { subtotal?: number; tax?: number; tip?: number; total?: number }) => {
    setReceipt((prev) => ({
      ...prev,
      ...(totals.subtotal !== undefined && { subtotal: totals.subtotal }),
      ...(totals.tax !== undefined && { tax: totals.tax }),
      ...(totals.tip !== undefined && { tip: totals.tip }),
      ...(totals.total !== undefined && { total: totals.total }),
    }))
  }

  return (
    <>
      {/* Receipt Header */}
      <div className="card p-8 mb-6 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 flex items-center justify-center flex-shrink-0">
            <ReceiptIcon className="h-7 w-7 text-[var(--primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {receipt.merchantName || 'Untitled Receipt'}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
              {receipt.receiptDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(receipt.receiptDate)}
                </span>
              )}
              {receipt.payer && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Paid by {receipt.payer.name}
                </span>
              )}
              {receipt.merchantName && (
                <span className="flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" />
                  {receipt.merchantName}
                </span>
              )}
            </div>
          </div>
          <span className={`badge ${receipt.status === 'REVIEW' ? 'badge-warning' : 'badge-muted'}`}>
            {receipt.status}
          </span>
        </div>

        {receipt.imageUrl && (
          <a
            href={receipt.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
          >
            <ImageIcon className="h-4 w-4" />
            View original receipt image
          </a>
        )}
      </div>

      {/* Line Items */}
      <div className="card mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="px-4 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--text-primary)]">
            Items ({receipt.lineItems.length})
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Hover items to edit, ignore, or delete
          </p>
        </div>

        {receipt.lineItems.length === 0 ? (
          <div className="px-4 py-8 text-center text-[var(--text-muted)]">
            No items — add one manually below
          </div>
        ) : (
          receipt.lineItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              receiptId={receipt.id}
              onItemUpdated={handleItemUpdated}
              onItemDeleted={handleItemDeleted}
            />
          ))
        )}

        <AddItemForm
          receiptId={receipt.id}
          onItemAdded={handleItemAdded}
        />
      </div>

      {/* Totals */}
      <TotalsPanel
        itemsSum={itemsSum}
        subtotal={receipt.subtotal}
        tax={receipt.tax}
        tip={receipt.tip}
        total={receipt.total}
        receiptId={receipt.id}
        onTotalsUpdated={handleTotalsUpdated}
      />

      {/* Next step hint */}
      <div className="mt-6 text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <p className="text-sm text-[var(--text-muted)] mb-3">
          Once items look correct, proceed to split among members
        </p>
        <Link
          href={`/groups/${receipt.groupId}`}
          className="btn btn-secondary"
        >
          Back to Group
        </Link>
      </div>
    </>
  )
}
