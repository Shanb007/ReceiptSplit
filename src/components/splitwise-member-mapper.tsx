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
} from 'lucide-react'

interface MemberMapping {
  memberId: string
  memberName: string
  splitwiseUserId: string | null
}

interface SplitwiseFriend {
  id: number
  first_name: string
  last_name: string
  email: string
}

interface SplitwiseMemberMapperProps {
  open: boolean
  groupId: string
  members: MemberMapping[]
  onClose: () => void
  onMappingComplete: (updatedMembers: MemberMapping[]) => void
}

export function SplitwiseMemberMapper({
  open,
  groupId,
  members,
  onClose,
  onMappingComplete,
}: SplitwiseMemberMapperProps) {
  const [friends, setFriends] = useState<SplitwiseFriend[]>([])
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
      setFilter('')
      setError('')
    }
  }, [open, members])

  // Fetch friends on open
  useEffect(() => {
    if (!open) return

    setIsLoading(true)
    fetch('/api/splitwise/friends')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch friends')
        return res.json()
      })
      .then((data) => setFriends(data.friends))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load friends'),
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

  const filteredFriends = friends.filter((f) => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return (
      f.first_name.toLowerCase().includes(q) ||
      f.last_name.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q)
    )
  })

  const handleMappingChange = (memberId: string, friendId: string | null) => {
    setMappings((prev) => {
      const next = new Map(prev)
      next.set(memberId, friendId)
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
              if (!res.ok) throw new Error(`Failed to update ${member.memberName}`)
            }),
          )
        }
      }

      await Promise.all(promises)

      onMappingComplete(
        members.map((m) => ({
          ...m,
          splitwiseUserId: mappings.get(m.memberId) ?? null,
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mappings')
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
            <Link2 className="h-5 w-5 text-[#5BC5A7]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Map to Splitwise
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
              Loading Splitwise friends...
            </div>
          ) : (
            <>
              {/* Search filter */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter friends..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                />
              </div>

              <p className="text-xs text-[var(--text-muted)] mb-3">
                Map each group member to their Splitwise account.
              </p>

              {/* Member rows */}
              <div className="space-y-3">
                {members.map((m) => {
                  const currentMapping = mappings.get(m.memberId)
                  const mappedFriend = friends.find(
                    (f) => String(f.id) === currentMapping,
                  )

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
                        <option value="">— Select Splitwise friend —</option>
                        {filteredFriends.map((f) => (
                          <option key={f.id} value={String(f.id)}>
                            {f.first_name} {f.last_name} ({f.email})
                          </option>
                        ))}
                      </select>

                      {mappedFriend && filter && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          Mapped to: {mappedFriend.first_name}{' '}
                          {mappedFriend.last_name}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
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
              {isSaving ? 'Saving...' : 'Save Mappings'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
