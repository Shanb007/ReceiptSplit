'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Loader2,
  Search,
  X,
  CheckCircle,
  AlertTriangle,
  Link2,
  Users,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react'

interface MemberMapping {
  memberId: string
  memberName: string
  splitwiseUserId: string | null
}

interface SplitwiseGroupMember {
  id: number
  first_name: string
  last_name: string
  email: string
}

interface SplitwiseGroup {
  id: number
  name: string
  members: SplitwiseGroupMember[]
}

interface SplitwiseMemberMapperProps {
  open: boolean
  groupId: string
  members: MemberMapping[]
  onClose: () => void
  onMappingComplete: (
    updatedMembers: MemberMapping[],
    splitwiseGroupId: number,
  ) => void
}

export function SplitwiseMemberMapper({
  open,
  groupId,
  members,
  onClose,
  onMappingComplete,
}: SplitwiseMemberMapperProps) {
  const [groups, setGroups] = useState<SplitwiseGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<SplitwiseGroup | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [mappings, setMappings] = useState<Map<string, string | null>>(
    new Map(),
  )

  // Initialize mappings from current members
  useEffect(() => {
    if (open) {
      const map = new Map<string, string | null>()
      for (const m of members) {
        map.set(m.memberId, m.splitwiseUserId)
      }
      setMappings(map)
      setSelectedGroup(null)
      setFilter('')
      setError('')
    }
  }, [open, members])

  // Fetch groups on open
  useEffect(() => {
    if (!open) return

    setIsLoading(true)
    fetch('/api/splitwise/groups')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch Splitwise groups')
        return res.json()
      })
      .then((data) => setGroups(data.groups))
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : 'Failed to load groups',
        ),
      )
      .finally(() => setIsLoading(false))
  }, [open])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose()
    },
    [onClose, isSaving],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }
  }, [open, handleKeyDown])

  const groupMembers = selectedGroup?.members || []

  const filteredMembers = groupMembers.filter((m) => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return (
      m.first_name.toLowerCase().includes(q) ||
      m.last_name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  })

  const handleMappingChange = (
    memberId: string,
    swUserId: string | null,
  ) => {
    setMappings((prev) => {
      const next = new Map(prev)
      next.set(memberId, swUserId)
      return next
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      // Save each changed mapping
      const promises: Promise<void>[] = []
      for (const member of members) {
        const newVal = mappings.get(member.memberId) ?? null
        if (newVal !== member.splitwiseUserId) {
          promises.push(
            fetch(`/api/groups/${groupId}/members/${member.memberId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ splitwiseUserId: newVal }),
            }).then((res) => {
              if (!res.ok)
                throw new Error(`Failed to update ${member.memberName}`)
            }),
          )
        }
      }

      // Also save the Splitwise group ID to the group
      promises.push(
        fetch(`/api/groups/${groupId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ splitwiseGroupId: selectedGroup!.id }),
        }).then((res) => {
          if (!res.ok) throw new Error('Failed to save Splitwise group link')
        }),
      )

      await Promise.all(promises)

      onMappingComplete(
        members.map((m) => ({
          ...m,
          splitwiseUserId: mappings.get(m.memberId) ?? null,
        })),
        selectedGroup!.id,
      )
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save mappings',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const allMapped = members.every((m) => mappings.get(m.memberId))

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={isSaving ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="card w-full max-w-lg relative z-10 animate-scale-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            {selectedGroup ? (
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                className="p-1 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-[var(--text-muted)]" />
              </button>
            ) : (
              <Link2 className="h-5 w-5 text-[#5BC5A7]" />
            )}
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {selectedGroup
                ? `Map Members — ${selectedGroup.name}`
                : 'Select Splitwise Group'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
          >
            <X className="h-4 w-4 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="flex items-center gap-2 text-sm text-[var(--error)] mb-4 p-3 rounded-lg bg-[var(--error)]/5">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-[var(--text-muted)]">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading Splitwise groups...
            </div>
          ) : !selectedGroup ? (
            /* ── Step 1: Pick a Splitwise group ── */
            <>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                Choose which Splitwise group to export this expense to.
              </p>

              {groups.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No Splitwise groups found.</p>
                  <p className="text-xs mt-1">
                    Create a group in Splitwise first.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setSelectedGroup(g)
                        setFilter('')
                      }}
                      className="w-full p-3 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--border)] transition-colors text-left flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#5BC5A7]/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-[#5BC5A7]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {g.name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {g.members.length} member
                          {g.members.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* ── Step 2: Map members to group members ── */
            <>
              {/* Search filter */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter group members..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                />
              </div>

              <p className="text-xs text-[var(--text-muted)] mb-3">
                Map each group member to their Splitwise account in &quot;{selectedGroup.name}&quot;.
              </p>

              {/* Member rows */}
              <div className="space-y-3">
                {members.map((m) => {
                  const currentMapping = mappings.get(m.memberId)

                  return (
                    <div
                      key={m.memberId}
                      className="p-3 rounded-xl bg-[var(--surface-hover)]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white text-[10px] font-semibold">
                            {m.memberName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {m.memberName}
                          </span>
                        </div>
                        {currentMapping && (
                          <CheckCircle className="h-4 w-4 text-[var(--success)]" />
                        )}
                      </div>

                      <select
                        value={currentMapping || ''}
                        onChange={(e) =>
                          handleMappingChange(
                            m.memberId,
                            e.target.value || null,
                          )
                        }
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                      >
                        <option value="">
                          — Select from {selectedGroup.name} —
                        </option>
                        {filteredMembers.map((sm) => (
                          <option key={sm.id} value={String(sm.id)}>
                            {sm.first_name} {sm.last_name} ({sm.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {selectedGroup && (
          <div className="p-5 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">
              {members.filter((m) => mappings.get(m.memberId)).length}/
              {members.length} mapped
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="btn btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !allMapped}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {isSaving ? 'Saving...' : 'Save & Export'}
              </button>
            </div>
          </div>
        )}

        {/* Footer for group selection step */}
        {!selectedGroup && !isLoading && (
          <div className="p-5 border-t border-[var(--border)] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
