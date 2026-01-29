'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Trash2, Loader2, Check, X } from 'lucide-react'
import { ConfirmDialog } from './confirm-dialog'

export interface SerializedMember {
  id: string
  name: string
  groupId: string
  splitwiseUserId: string | null
  createdAt: string
  updatedAt: string
}

interface MemberCardProps {
  member: SerializedMember
  groupId: string
  isOnlyMember: boolean
  onMemberUpdated: (updatedMember: SerializedMember) => void
  onMemberDeleted: (memberId: string) => void
}

export function MemberCard({
  member,
  groupId,
  isOnlyMember,
  onMemberUpdated,
  onMemberDeleted,
}: MemberCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(member.name)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    const trimmed = editName.trim()
    if (!trimmed) {
      setError('Name cannot be empty')
      return
    }
    if (trimmed === member.name) {
      setIsEditing(false)
      setError('')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update member')
      }
      const updated = await res.json()
      onMemberUpdated(updated)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditName(member.name)
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

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${member.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete member')
      }
      onMemberDeleted(member.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isEditing) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-hover)] animate-scale-in">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {editName.trim() ? editName.trim().charAt(0).toUpperCase() : member.name.charAt(0).toUpperCase()}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="bg-transparent border-none outline-none text-sm font-medium text-[var(--text-primary)] w-24 p-0"
          style={{ minWidth: '80px' }}
        />
        {isSaving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--text-muted)]" />
        ) : (
          <>
            <button
              type="button"
              onClick={handleSave}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--success)] hover:bg-[var(--success)]/10 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {error && (
          <span className="text-[var(--error)] text-xs">{error}</span>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="group/member inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {member.name.charAt(0).toUpperCase()}
        </div>
        {member.name}

        {/* Action buttons - visible on hover */}
        <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover/member:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>
          {!isOnlyMember && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Remove Member"
        description={`Are you sure you want to remove ${member.name} from this group? This cannot be undone.`}
        confirmLabel="Remove"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}
