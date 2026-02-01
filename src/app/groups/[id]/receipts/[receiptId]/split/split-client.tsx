'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
import { ItemSplitter, type SplitMode } from '@/components/item-splitter'
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

// Map<lineItemId, Map<memberId, number>>
type SharesMap = Map<string, Map<string, number>>

/**
 * Detect if saved assignments for an item were manual mode.
 * Convention: manual mode saves shareNumerator = cents, shareDenominator = lineTotal.
 * Ratio mode saves shareNumerator = small weight, shareDenominator = sum of weights.
 * If shareDenominator equals the item lineTotal, treat as manual.
 */
function detectMode(
  itemId: string,
  assignments: AssignmentData[],
  lineItems: LineItemData[]
): SplitMode {
  const item = lineItems.find((i) => i.id === itemId)
  if (!item) return 'ratio'
  const itemAssignments = assignments.filter((a) => a.lineItemId === itemId)
  if (itemAssignments.length < 2) return 'ratio'
  // If every assignment's denominator matches the item lineTotal, it's manual
  const allManual = itemAssignments.every((a) => a.shareDenominator === item.lineTotal)
  // Extra guard: in manual mode, numerators should sum to lineTotal
  if (allManual) {
    const numSum = itemAssignments.reduce((s, a) => s + a.shareNumerator, 0)
    if (numSum === item.lineTotal) return 'manual'
  }
  return 'ratio'
}

export function SplitClient({
  receipt: initialReceipt,
  initialAssignments,
}: {
  receipt: ReceiptData
  initialAssignments: AssignmentData[]
}) {
  const router = useRouter()
  const [receipt, setReceipt] = useState(initialReceipt)

  // Split mode per item
  const [splitModes, setSplitModes] = useState<Map<string, SplitMode>>(() => {
    const map = new Map<string, SplitMode>()
    for (const item of initialReceipt.lineItems) {
      map.set(item.id, detectMode(item.id, initialAssignments, initialReceipt.lineItems))
    }
    return map
  })

  // Ratio weights: Map<lineItemId, Map<memberId, weight>>
  const [shares, setShares] = useState<SharesMap>(() => {
    const map: SharesMap = new Map()
    for (const item of initialReceipt.lineItems) {
      map.set(item.id, new Map())
    }
    for (const a of initialAssignments) {
      const mode = detectMode(a.lineItemId, initialAssignments, initialReceipt.lineItems)
      if (mode === 'ratio') {
        const itemMap = map.get(a.lineItemId)
        if (itemMap) itemMap.set(a.memberId, a.shareNumerator)
      }
    }
    return map
  })

  // Manual amounts in cents: Map<lineItemId, Map<memberId, cents>>
  const [manualAmounts, setManualAmounts] = useState<SharesMap>(() => {
    const map: SharesMap = new Map()
    for (const item of initialReceipt.lineItems) {
      map.set(item.id, new Map())
    }
    for (const a of initialAssignments) {
      const mode = detectMode(a.lineItemId, initialAssignments, initialReceipt.lineItems)
      if (mode === 'manual') {
        const itemMap = map.get(a.lineItemId)
        if (itemMap) itemMap.set(a.memberId, a.shareNumerator)
      }
    }
    return map
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const members = receipt.group.members

  const clearStatus = () => {
    setSaveSuccess(false)
    setError('')
  }

  // ─── Mode switching ───
  const handleModeChange = (itemId: string, mode: SplitMode) => {
    const currentMode = splitModes.get(itemId)
    if (currentMode === mode) return

    if (mode === 'manual') {
      // Switching to manual: pre-fill from ratio-computed amounts
      const ratioMap = shares.get(itemId) || new Map()
      const item = receipt.lineItems.find((i) => i.id === itemId)
      if (item && ratioMap.size > 0) {
        const totalWeight = Array.from(ratioMap.values()).reduce((s, v) => s + v, 0)
        const newManual = new Map<string, number>()
        let allocated = 0
        const entries = Array.from(ratioMap.entries())
        for (let i = 0; i < entries.length; i++) {
          const [memberId, weight] = entries[i]
          if (i === entries.length - 1) {
            newManual.set(memberId, item.lineTotal - allocated)
          } else {
            const share = Math.floor((item.lineTotal * weight) / totalWeight)
            newManual.set(memberId, share)
            allocated += share
          }
        }
        setManualAmounts((prev) => {
          const next = new Map(prev)
          next.set(itemId, newManual)
          return next
        })
      }
    } else {
      // Switching to ratio: reset to equal (1 per person), keeping same members
      const manualMap = manualAmounts.get(itemId) || new Map()
      const newRatio = new Map<string, number>()
      for (const memberId of manualMap.keys()) {
        newRatio.set(memberId, 1)
      }
      setShares((prev) => {
        const next = new Map(prev)
        next.set(itemId, newRatio)
        return next
      })
    }

    setSplitModes((prev) => {
      const next = new Map(prev)
      next.set(itemId, mode)
      return next
    })
    clearStatus()
  }

  // ─── Toggle member (works in both modes) ───
  const handleToggleMember = (itemId: string, memberId: string) => {
    const mode = splitModes.get(itemId) || 'ratio'

    if (mode === 'ratio') {
      setShares((prev) => {
        const next = new Map(prev)
        const itemMap = new Map(next.get(itemId) || [])
        if (itemMap.has(memberId)) {
          itemMap.delete(memberId)
        } else {
          itemMap.set(memberId, 1)
        }
        next.set(itemId, itemMap)
        return next
      })
    } else {
      setManualAmounts((prev) => {
        const next = new Map(prev)
        const itemMap = new Map(next.get(itemId) || [])
        if (itemMap.has(memberId)) {
          itemMap.delete(memberId)
        } else {
          itemMap.set(memberId, 0)
        }
        next.set(itemId, itemMap)
        return next
      })
    }
    clearStatus()
  }

  // ─── Ratio share change ───
  const handleShareChange = (itemId: string, memberId: string, share: number) => {
    setShares((prev) => {
      const next = new Map(prev)
      const itemMap = new Map(next.get(itemId) || [])
      itemMap.set(memberId, share)
      next.set(itemId, itemMap)
      return next
    })
    clearStatus()
  }

  // ─── Manual amount change ───
  const handleManualAmountChange = (itemId: string, memberId: string, cents: number) => {
    setManualAmounts((prev) => {
      const next = new Map(prev)
      const itemMap = new Map(next.get(itemId) || [])
      itemMap.set(memberId, cents)
      next.set(itemId, itemMap)
      return next
    })
    clearStatus()
  }

  // ─── Select all (works in both modes) ───
  const handleSelectAll = (itemId: string) => {
    const mode = splitModes.get(itemId) || 'ratio'

    if (mode === 'ratio') {
      setShares((prev) => {
        const next = new Map(prev)
        const current = next.get(itemId) || new Map()
        const allSelected = members.every((m) => current.has(m.id))
        if (allSelected) {
          next.set(itemId, new Map())
        } else {
          const itemMap = new Map<string, number>()
          members.forEach((m) => itemMap.set(m.id, 1))
          next.set(itemId, itemMap)
        }
        return next
      })
    } else {
      setManualAmounts((prev) => {
        const next = new Map(prev)
        const current = next.get(itemId) || new Map()
        const allSelected = members.every((m) => current.has(m.id))
        if (allSelected) {
          next.set(itemId, new Map())
        } else {
          const itemMap = new Map<string, number>()
          members.forEach((m) => itemMap.set(m.id, current.get(m.id) || 0))
          next.set(itemId, itemMap)
        }
        return next
      })
    }
    clearStatus()
  }

  // ─── Everyone on all ───
  const handleSelectAllEveryone = () => {
    setShares((prev) => {
      const next = new Map(prev)
      for (const item of receipt.lineItems) {
        if ((splitModes.get(item.id) || 'ratio') === 'ratio') {
          const itemMap = new Map<string, number>()
          members.forEach((m) => itemMap.set(m.id, 1))
          next.set(item.id, itemMap)
        }
      }
      return next
    })
    setManualAmounts((prev) => {
      const next = new Map(prev)
      for (const item of receipt.lineItems) {
        if (splitModes.get(item.id) === 'manual') {
          const current = next.get(item.id) || new Map()
          const itemMap = new Map<string, number>()
          members.forEach((m) => itemMap.set(m.id, current.get(m.id) || 0))
          next.set(item.id, itemMap)
        }
      }
      return next
    })
    clearStatus()
  }

  // ─── Strategy changes ───
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

  // ─── Validation ───
  const getItemAssignedCount = (itemId: string) => {
    const mode = splitModes.get(itemId) || 'ratio'
    const map = mode === 'ratio' ? shares.get(itemId) : manualAmounts.get(itemId)
    return map?.size || 0
  }

  const getManualError = (itemId: string): string | null => {
    if ((splitModes.get(itemId) || 'ratio') !== 'manual') return null
    const map = manualAmounts.get(itemId)
    if (!map || map.size === 0) return null
    const item = receipt.lineItems.find((i) => i.id === itemId)
    if (!item) return null
    const sum = Array.from(map.values()).reduce((s, v) => s + v, 0)
    if (sum !== item.lineTotal) {
      const diff = item.lineTotal - sum
      return diff > 0
        ? `$${formatCents(diff)} unallocated`
        : `$${formatCents(Math.abs(diff))} over`
    }
    return null
  }

  // ─── Save ───
  const handleSave = async () => {
    // Check all items assigned
    const unassigned = receipt.lineItems.filter((item) => getItemAssignedCount(item.id) === 0)
    if (unassigned.length > 0) {
      setError(`${unassigned.length} item(s) still need to be assigned to at least one person`)
      return
    }

    // Check manual items balance
    const manualErrors: string[] = []
    for (const item of receipt.lineItems) {
      const err = getManualError(item.id)
      if (err) manualErrors.push(`${item.name}: ${err}`)
    }
    if (manualErrors.length > 0) {
      setError(`Manual split amounts don't add up: ${manualErrors.join(', ')}`)
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

      for (const item of receipt.lineItems) {
        const mode = splitModes.get(item.id) || 'ratio'

        if (mode === 'ratio') {
          const memberMap = shares.get(item.id) || new Map()
          const totalWeight = Array.from(memberMap.values()).reduce((s, v) => s + v, 0)
          for (const [memberId, weight] of memberMap) {
            flatAssignments.push({
              lineItemId: item.id,
              memberId,
              shareNumerator: weight,
              shareDenominator: totalWeight,
            })
          }
        } else {
          // Manual: store cents as numerator, lineTotal as denominator
          const amountMap = manualAmounts.get(item.id) || new Map()
          for (const [memberId, cents] of amountMap) {
            flatAssignments.push({
              lineItemId: item.id,
              memberId,
              shareNumerator: cents,
              shareDenominator: item.lineTotal,
            })
          }
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
      setTimeout(() => {
        router.push(`/groups/${receipt.group.id}/receipts/${receipt.id}`)
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Live per-person totals ───
  const personTotals = useMemo(() => {
    const totals = new Map<string, { items: number; tax: number; tip: number; total: number }>()

    for (const m of members) {
      totals.set(m.id, { items: 0, tax: 0, tip: 0, total: 0 })
    }

    const allItemsSum = receipt.lineItems.reduce((sum, item) => sum + item.lineTotal, 0)

    for (const item of receipt.lineItems) {
      const mode = splitModes.get(item.id) || 'ratio'

      if (mode === 'manual') {
        // Manual: use amounts directly
        const amountMap = manualAmounts.get(item.id)
        if (!amountMap || amountMap.size === 0) continue
        for (const [memberId, cents] of amountMap) {
          const entry = totals.get(memberId)
          if (entry) entry.items += cents
        }
      } else {
        // Ratio
        const memberMap = shares.get(item.id)
        if (!memberMap || memberMap.size === 0) continue

        const totalWeight = Array.from(memberMap.values()).reduce((s, v) => s + v, 0)
        if (totalWeight === 0) continue

        let allocated = 0
        const entries = Array.from(memberMap.entries())
        for (let i = 0; i < entries.length; i++) {
          const [memberId, weight] = entries[i]
          const entry = totals.get(memberId)
          if (!entry) continue

          if (i === entries.length - 1) {
            entry.items += item.lineTotal - allocated
          } else {
            const share = Math.floor((item.lineTotal * weight) / totalWeight)
            entry.items += share
            allocated += share
          }
        }
      }
    }

    // Allocate tax
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

    // Allocate tip
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

    for (const [, entry] of totals) {
      entry.total = entry.items + entry.tax + entry.tip
    }

    return totals
  }, [receipt, shares, manualAmounts, splitModes, members])

  const participantsWithTotals = Array.from(personTotals.entries()).filter(
    ([, v]) => v.total > 0
  )
  const grandTotal = participantsWithTotals.reduce((sum, [, v]) => sum + v.total, 0)

  const unassignedCount = receipt.lineItems.filter(
    (item) => getItemAssignedCount(item.id) === 0
  ).length

  const hasManualErrors = receipt.lineItems.some((item) => getManualError(item.id) !== null)

  const allAssigned = unassignedCount === 0 && receipt.lineItems.length > 0 && !hasManualErrors

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

      {/* Two-column layout */}
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6">
        {/* Left column */}
        <div>
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
                  memberShares={shares.get(item.id) || new Map()}
                  manualAmounts={manualAmounts.get(item.id) || new Map()}
                  splitMode={splitModes.get(item.id) || 'ratio'}
                  onToggleMember={handleToggleMember}
                  onShareChange={handleShareChange}
                  onManualAmountChange={handleManualAmountChange}
                  onModeChange={handleModeChange}
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
        </div>

        {/* Right column — sticky */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          {/* Split Preview */}
          <div className="card p-5 mb-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
                      className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white text-[10px] font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {member.name}
                          </span>
                          {receipt.payer?.id === memberId && (
                            <span className="badge badge-primary text-[9px] ml-1.5">PAYER</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-sm text-[var(--text-primary)] tabular-nums">
                          ${formatCents(entry.total)}
                        </span>
                        <div className="text-[10px] text-[var(--text-muted)] tabular-nums">
                          ${formatCents(entry.items)}
                          {(receipt.tax ?? 0) > 0 && ` + $${formatCents(entry.tax)} tax`}
                          {(receipt.tip ?? 0) > 0 && ` + $${formatCents(entry.tip)} tip`}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Grand total */}
                <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-[var(--border)]">
                  <span className="font-semibold text-sm text-[var(--text-primary)]">Total</span>
                  <span className="font-bold text-base tabular-nums text-[var(--text-primary)]">
                    ${formatCents(grandTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Status + Save */}
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
                Saved! Redirecting...
              </div>
            )}

            <div className="text-sm text-[var(--text-muted)] mb-3">
              {allAssigned ? (
                <span className="text-[var(--success)] flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  All items assigned
                </span>
              ) : hasManualErrors ? (
                <span className="text-[var(--error)] flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  Manual split amounts don&apos;t add up
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
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </>
  )
}
