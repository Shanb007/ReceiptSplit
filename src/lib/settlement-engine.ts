/**
 * Settlement Engine — pure computation, no DB dependency.
 *
 * Ported from split-client.tsx personTotals useMemo (lines 472-571)
 * so that the server can produce identical numbers.
 */

// ── Input types ──────────────────────────────────────────────

export interface LineItemInput {
  id: string
  lineTotal: number // cents
}

export interface AssignmentInput {
  lineItemId: string
  memberId: string
  shareNumerator: number
  shareDenominator: number
}

export type Strategy = 'PROPORTIONAL' | 'EQUAL'

// ── Output type ──────────────────────────────────────────────

export interface SettlementResult {
  memberId: string
  itemsTotal: number // cents
  taxShare: number   // cents
  tipShare: number   // cents
  finalAmount: number // cents
}

// ── Mode detection (mirrors split-client.tsx:84-101) ─────────

function detectMode(
  itemId: string,
  itemLineTotal: number,
  itemAssignments: AssignmentInput[],
): 'ratio' | 'manual' {
  if (itemAssignments.length < 2) return 'ratio'

  const allManual = itemAssignments.every(
    (a) => a.shareDenominator === itemLineTotal,
  )

  if (allManual) {
    const numSum = itemAssignments.reduce((s, a) => s + a.shareNumerator, 0)
    if (numSum === itemLineTotal) return 'manual'
  }

  return 'ratio'
}

// ── Allocate an amount among participants ─────────────────────

function allocate(
  amount: number,
  participants: { memberId: string; weight: number }[],
  totalWeight: number,
  strategy: Strategy,
): Map<string, number> {
  const result = new Map<string, number>()
  if (participants.length === 0 || amount === 0) return result

  if (strategy === 'PROPORTIONAL' && totalWeight > 0) {
    let allocated = 0
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i]
      if (i === participants.length - 1) {
        result.set(p.memberId, amount - allocated)
      } else {
        const share = Math.round((p.weight / totalWeight) * amount)
        result.set(p.memberId, share)
        allocated += share
      }
    }
  } else {
    // EQUAL
    const base = Math.floor(amount / participants.length)
    const remainder = amount - base * participants.length
    for (let i = 0; i < participants.length; i++) {
      result.set(
        participants[i].memberId,
        base + (i < remainder ? 1 : 0),
      )
    }
  }

  return result
}

// ── Main entry point ─────────────────────────────────────────

export function computeSettlements(
  lineItems: LineItemInput[],
  assignments: AssignmentInput[],
  tax: number,
  tip: number,
  taxStrategy: Strategy,
  tipStrategy: Strategy,
): SettlementResult[] {
  // Collect all unique member IDs
  const memberIds = [...new Set(assignments.map((a) => a.memberId))]
  const totals = new Map<
    string,
    { items: number; tax: number; tip: number }
  >()
  for (const id of memberIds) {
    totals.set(id, { items: 0, tax: 0, tip: 0 })
  }

  // ── Phase 1: Item allocation ───────────────────────────────

  for (const item of lineItems) {
    const itemAssignments = assignments.filter(
      (a) => a.lineItemId === item.id,
    )
    if (itemAssignments.length === 0) continue

    const mode = detectMode(item.id, item.lineTotal, itemAssignments)

    if (mode === 'manual') {
      for (const a of itemAssignments) {
        const entry = totals.get(a.memberId)
        if (entry) entry.items += a.shareNumerator
      }
    } else {
      // Ratio mode
      const totalWeight = itemAssignments.reduce(
        (s, a) => s + a.shareNumerator,
        0,
      )
      if (totalWeight === 0) continue

      let allocated = 0
      for (let i = 0; i < itemAssignments.length; i++) {
        const a = itemAssignments[i]
        const entry = totals.get(a.memberId)
        if (!entry) continue

        if (i === itemAssignments.length - 1) {
          entry.items += item.lineTotal - allocated
        } else {
          const share = Math.floor(
            (item.lineTotal * a.shareNumerator) / totalWeight,
          )
          entry.items += share
          allocated += share
        }
      }
    }
  }

  // ── Phase 2: Tax allocation ────────────────────────────────

  if (tax > 0) {
    const participants = Array.from(totals.entries())
      .filter(([, v]) => v.items > 0)
      .map(([memberId, v]) => ({ memberId, weight: v.items }))

    const allItemsSum = participants.reduce((s, p) => s + p.weight, 0)

    const taxShares = allocate(tax, participants, allItemsSum, taxStrategy)
    for (const [memberId, share] of taxShares) {
      const entry = totals.get(memberId)
      if (entry) entry.tax = share
    }
  }

  // ── Phase 3: Tip allocation ────────────────────────────────

  if (tip > 0) {
    const participants = Array.from(totals.entries())
      .filter(([, v]) => v.items > 0)
      .map(([memberId, v]) => ({ memberId, weight: v.items }))

    const allItemsSum = participants.reduce((s, p) => s + p.weight, 0)

    const tipShares = allocate(tip, participants, allItemsSum, tipStrategy)
    for (const [memberId, share] of tipShares) {
      const entry = totals.get(memberId)
      if (entry) entry.tip = share
    }
  }

  // ── Build results ──────────────────────────────────────────

  return memberIds.map((memberId) => {
    const entry = totals.get(memberId)!
    return {
      memberId,
      itemsTotal: entry.items,
      taxShare: entry.tax,
      tipShare: entry.tip,
      finalAmount: entry.items + entry.tax + entry.tip,
    }
  })
}
