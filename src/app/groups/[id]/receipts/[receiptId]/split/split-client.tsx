'use client'

import { useState, useMemo } from 'react'
import {
  Receipt as ReceiptIcon,
  Calendar,
  User,
  Store,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Users,
} from 'lucide-react'
import { ItemSplitter } from '@/components/item-splitter'
import { TaxTipStrategySelector } from '@/components/tax-tip-strategy-selector'

interface MemberData {
  id: string
  name: string
}

interface LineItemData {
  id: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

interface AssignmentData {
  id: string
  lineItemId: string
  memberId: string
  shareNumerator: number
  shareDenominator: number
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
  taxStrategy: 'PROPORTIONAL' | 'EQUAL'
  tipStrategy: 'PROPORTIONAL' | 'EQUAL'
  status: string
  lineItems: LineItemData[]
  payer: { id: string; name: string } | null
  group: {
    id: string
    name: string
    members: MemberData[]
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

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function SplitClient({
  receipt: initialReceipt,
  initialAssignments,
}: {
  receipt: ReceiptData
  initialAssignments: AssignmentData[]
}) {
  const [receipt, setReceipt] = useState(initialReceipt)

  // Map<lineItemId, Set<memberId>>
  const [assignments, setAssignments] = useState<Map<string, Set<string>>>(() => {
    const map = new Map<string, Set<string>>()
    for (const item of initialReceipt.lineItems) {
      map.set(item.id, new Set())
    }
    for (const a of initialAssignments) {
      const set = map.get(a.lineItemId)
      if (set) set.add(a.memberId)
    }
    return map
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const members = receipt.group.members

  // Toggle a member on/off for an item
  const handleToggleMember = (itemId: string, memberId: string) => {
    setAssignments((prev) => {
      const next = new Map(prev)
      const memberSet = new Set(next.get(itemId) || [])
      if (memberSet.has(memberId)) {
        memberSet.delete(memberId)
      } else {
        memberSet.add(memberId)
      }
      next.set(itemId, memberSet)
      return next
    })
    setSaveSuccess(false)
    setError('')
  }

  // Select/deselect all members for an item
  const handleSelectAll = (itemId: string) => {
    setAssignments((prev) => {
      const next = new Map(prev)
      const current = next.get(itemId) || new Set()
      const allSelected = members.every((m) => current.has(m.id))
      if (allSelected) {
        next.set(itemId, new Set())
      } else {
        next.set(itemId, new Set(members.map((m) => m.id)))
      }
      return next
    })
    setSaveSuccess(false)
    setError('')
  }

  // Select all members for ALL items
  const handleSelectAllEveryone = () => {
    setAssignments((prev) => {
      const next = new Map(prev)
      for (const item of receipt.lineItems) {
        next.set(item.id, new Set(members.map((m) => m.id)))
      }
      return next
    })
    setSaveSuccess(false)
    setError('')
  }

  // Strategy changes — persist via existing receipt PUT
  const handleTaxStrategyChange = async (strategy: 'PROPORTIONAL' | 'EQUAL') => {
    const prev = receipt.taxStrategy
    setReceipt((r) => ({ ...r, taxStrategy: strategy }))
    try {
      const res = await fetch(`/api/receipts/${receipt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxStrategy: strategy }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setReceipt((r) => ({ ...r, taxStrategy: prev }))
    }
  }

  const handleTipStrategyChange = async (strategy: 'PROPORTIONAL' | 'EQUAL') => {
    const prev = receipt.tipStrategy
    setReceipt((r) => ({ ...r, tipStrategy: strategy }))
    try {
      const res = await fetch(`/api/receipts/${receipt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipStrategy: strategy }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setReceipt((r) => ({ ...r, tipStrategy: prev }))
    }
  }

  // Save all assignments
  const handleSave = async () => {
    const unassigned = receipt.lineItems.filter(
      (item) => !(assignments.get(item.id)?.size)
    )
    if (unassigned.length > 0) {
      setError(`${unassigned.length} item(s) still need to be assigned to at least one person`)
      return
    }

    setIsSaving(true)
    setError('')
    try {
      const flatAssignments: {
        lineItemId: string
        memberId: string
        shareNumerator: number
        shareDenominator: number
      }[] = []

      for (const [lineItemId, memberIds] of assignments) {
        const denominator = memberIds.size
        for (const memberId of memberIds) {
          flatAssignments.push({
            lineItemId,
            memberId,
            shareNumerator: 1,
            shareDenominator: denominator,
          })
        }
      }

      const res = await fetch(`/api/receipts/${receipt.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: flatAssignments }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save assignments')
      }

      setSaveSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  // Live per-person totals
  const personTotals = useMemo(() => {
    const totals = new Map<string, { items: number; tax: number; tip: number; total: number }>()

    for (const m of members) {
      totals.set(m.id, { items: 0, tax: 0, tip: 0, total: 0 })
    }

    const allItemsSum = receipt.lineItems.reduce((sum, item) => sum + item.lineTotal, 0)

    // Step 1: compute each person's item share
    for (const item of receipt.lineItems) {
      const memberIds = assignments.get(item.id)
      if (!memberIds || memberIds.size === 0) continue
      const sharePerPerson = Math.floor(item.lineTotal / memberIds.size)
      const remainder = item.lineTotal - sharePerPerson * memberIds.size
      let idx = 0
      for (const memberId of memberIds) {
        const entry = totals.get(memberId)
        if (entry) {
          entry.items += sharePerPerson + (idx < remainder ? 1 : 0)
        }
        idx++
      }
    }

    // Step 2: allocate tax
    const tax = receipt.tax || 0
    if (tax > 0) {
      const participants = Array.from(totals.entries()).filter(([, v]) => v.items > 0)
      if (receipt.taxStrategy === 'PROPORTIONAL' && allItemsSum > 0) {
        let taxAllocated = 0
        for (let i = 0; i < participants.length; i++) {
          const [, entry] = participants[i]
          if (i === participants.length - 1) {
            entry.tax = tax - taxAllocated
          } else {
            entry.tax = Math.round((entry.items / allItemsSum) * tax)
            taxAllocated += entry.tax
          }
        }
      } else if (receipt.taxStrategy === 'EQUAL' && participants.length > 0) {
        const sharePerPerson = Math.floor(tax / participants.length)
        const remainder = tax - sharePerPerson * participants.length
        participants.forEach(([, entry], idx) => {
          entry.tax = sharePerPerson + (idx < remainder ? 1 : 0)
        })
      }
    }

    // Step 3: allocate tip (same logic)
    const tip = receipt.tip || 0
    if (tip > 0) {
      const participants = Array.from(totals.entries()).filter(([, v]) => v.items > 0)
      if (receipt.tipStrategy === 'PROPORTIONAL' && allItemsSum > 0) {
        let tipAllocated = 0
        for (let i = 0; i < participants.length; i++) {
          const [, entry] = participants[i]
          if (i === participants.length - 1) {
            entry.tip = tip - tipAllocated
          } else {
            entry.tip = Math.round((entry.items / allItemsSum) * tip)
            tipAllocated += entry.tip
          }
        }
      } else if (receipt.tipStrategy === 'EQUAL' && participants.length > 0) {
        const sharePerPerson = Math.floor(tip / participants.length)
        const remainder = tip - sharePerPerson * participants.length
        participants.forEach(([, entry], idx) => {
          entry.tip = sharePerPerson + (idx < remainder ? 1 : 0)
        })
      }
    }

    // Step 4: compute final total per person
    for (const [, entry] of totals) {
      entry.total = entry.items + entry.tax + entry.tip
    }

    return totals
  }, [receipt, assignments, members])

  const participantsWithTotals = Array.from(personTotals.entries()).filter(
    ([, v]) => v.total > 0
  )
  const grandTotal = participantsWithTotals.reduce((sum, [, v]) => sum + v.total, 0)

  const unassignedCount = receipt.lineItems.filter(
    (item) => !(assignments.get(item.id)?.size)
  ).length

  const allAssigned = unassignedCount === 0 && receipt.lineItems.length > 0

  return (
    <>
      {/* Receipt Header */}
      <div className="card p-6 mb-6 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 flex items-center justify-center flex-shrink-0">
            <ReceiptIcon className="h-6 w-6 text-[var(--primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Split Items
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {receipt.merchantName || 'Untitled Receipt'}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
              {receipt.receiptDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(receipt.receiptDate)}
                </span>
              )}
              {receipt.payer && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Paid by {receipt.payer.name}
                </span>
              )}
              {receipt.merchantName && (
                <span className="flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  {receipt.merchantName}
                </span>
              )}
            </div>
          </div>
          <span className="badge badge-primary">SPLITTING</span>
        </div>
      </div>

      {/* Assign Items */}
      <div className="card mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="px-4 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--text-primary)]">
            Assign Items ({receipt.lineItems.length})
          </h2>
          <button
            type="button"
            onClick={handleSelectAllEveryone}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors cursor-pointer"
          >
            <Users className="h-3.5 w-3.5" />
            Everyone on all
          </button>
        </div>

        {receipt.lineItems.length === 0 ? (
          <div className="px-4 py-8 text-center text-[var(--text-muted)]">
            No valid items to split
          </div>
        ) : (
          receipt.lineItems.map((item) => (
            <ItemSplitter
              key={item.id}
              item={item}
              members={members}
              assignedMemberIds={assignments.get(item.id) || new Set()}
              onToggleMember={handleToggleMember}
              onSelectAll={handleSelectAll}
            />
          ))
        )}
      </div>

      {/* Tax & Tip Strategy */}
      {((receipt.tax && receipt.tax > 0) || (receipt.tip && receipt.tip > 0)) && (
        <div className="card p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="font-semibold text-[var(--text-primary)] mb-2">
            Tax & Tip Settings
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            Proportional = based on each person&apos;s items total. Equal = split evenly.
          </p>
          <TaxTipStrategySelector
            taxStrategy={receipt.taxStrategy}
            tipStrategy={receipt.tipStrategy}
            onTaxStrategyChange={handleTaxStrategyChange}
            onTipStrategyChange={handleTipStrategyChange}
            taxAmount={receipt.tax}
            tipAmount={receipt.tip}
          />
        </div>
      )}

      {/* Split Preview */}
      <div className="card p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">
          Split Preview
        </h2>

        {participantsWithTotals.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">
            Assign items to see the split preview
          </p>
        ) : (
          <div className="space-y-0">
            {participantsWithTotals.map(([memberId, entry]) => {
              const member = members.find((m) => m.id === memberId)
              if (!member) return null
              return (
                <div
                  key={memberId}
                  className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-b-0"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white text-xs font-semibold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {member.name}
                      </span>
                      {receipt.payer?.id === memberId && (
                        <span className="badge badge-primary text-[10px] ml-2">PAYER</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                      ${formatCents(entry.total)}
                    </span>
                    <div className="text-[11px] text-[var(--text-muted)] tabular-nums">
                      ${formatCents(entry.items)}
                      {(receipt.tax ?? 0) > 0 && ` + $${formatCents(entry.tax)} tax`}
                      {(receipt.tip ?? 0) > 0 && ` + $${formatCents(entry.tip)} tip`}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Grand total */}
            <div className="flex items-center justify-between pt-4 mt-2 border-t-2 border-[var(--border)]">
              <span className="font-semibold text-[var(--text-primary)]">Total</span>
              <span className="font-bold text-lg tabular-nums text-[var(--text-primary)]">
                ${formatCents(grandTotal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        {error && (
          <div className="flex items-center gap-2 text-sm text-[var(--error)] mb-3 p-3 rounded-lg bg-[var(--error)]/5">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="flex items-center gap-2 text-sm text-[var(--success)] mb-3 p-3 rounded-lg bg-[var(--success)]/5">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            Assignments saved successfully!
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-[var(--text-muted)]">
            {allAssigned ? (
              <span className="text-[var(--success)] flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                All items assigned
              </span>
            ) : (
              <span className="text-[var(--warning)] flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                {unassignedCount} item(s) unassigned
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !allAssigned}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </>
  )
}
