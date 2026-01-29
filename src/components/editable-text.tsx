'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Loader2 } from 'lucide-react'

interface EditableTextProps {
  value: string
  onSave: (newValue: string) => Promise<void>
  className?: string
  inputClassName?: string
  as?: 'h1' | 'h2' | 'span'
}

export function EditableText({
  value,
  onSave,
  className = '',
  inputClassName = '',
  as: Tag = 'span',
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setDraft(value)
  }, [value])

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      setError('Name cannot be empty')
      return
    }
    if (trimmed === value) {
      setIsEditing(false)
      setError('')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await onSave(trimmed)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setDraft(value)
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

  if (isEditing) {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            disabled={isSaving}
            className={`input py-2 px-3 text-lg font-bold ${inputClassName}`}
          />
          {isSaving && <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)] flex-shrink-0" />}
        </div>
        {error && (
          <p className="text-[var(--error)] text-xs mt-1">{error}</p>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="group/edit inline-flex items-center gap-2 text-left cursor-pointer bg-transparent border-none p-0"
    >
      <Tag className={className}>{value}</Tag>
      <Pencil className="h-4 w-4 text-[var(--text-muted)] opacity-0 group-hover/edit:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  )
}
