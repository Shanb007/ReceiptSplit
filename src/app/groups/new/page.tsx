'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Users,
  ArrowRight,
  Link2,
  ChevronRight,
  AlertTriangle,
  Settings,
  CheckCircle,
} from 'lucide-react'

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

export default function NewGroupPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'manual' | 'import'>('manual')

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8 max-w-xl">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to groups
        </Link>

        <div className="animate-fade-in-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 flex items-center justify-center">
              <Users className="h-7 w-7 text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                New Group
              </h1>
              <p className="text-[var(--text-secondary)]">
                Create manually or import from Splitwise
              </p>
            </div>
          </div>

          {/* Tab Toggle */}
          <div className="flex rounded-xl bg-[var(--surface-hover)] p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'manual'
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Users className="h-4 w-4" />
              Create Manually
            </button>
            <button
              type="button"
              onClick={() => setMode('import')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'import'
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Link2 className="h-4 w-4" />
              Import from Splitwise
            </button>
          </div>

          {mode === 'manual' ? <ManualCreateForm /> : <SplitwiseImport />}
        </div>
      </main>
    </div>
  )
}

/* ── Manual Create Form (existing logic) ── */

function ManualCreateForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [members, setMembers] = useState<string[]>(['', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const addMember = () => {
    setMembers([...members, ''])
  }

  const removeMember = (index: number) => {
    if (members.length <= 2) return
    const newMembers = members.filter((_, i) => i !== index)
    setMembers(newMembers)
  }

  const updateMember = (index: number, value: string) => {
    const newMembers = [...members]
    newMembers[index] = value
    setMembers(newMembers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validMembers = members.filter((m) => m.trim())
    if (!name.trim()) {
      setError('Please enter a group name')
      return
    }
    if (validMembers.length < 2) {
      setError('Please add at least two members')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          members: validMembers.map((m) => ({
            name: m.trim(),
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create group')
      }

      const group = await res.json()
      router.push(`/groups/${group.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-[var(--error)]/10 text-[var(--error)] px-4 py-3 rounded-xl text-sm animate-scale-in">
          {error}
        </div>
      )}

      {/* Group Name */}
      <div className="card p-6">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          Group Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Dinner at Joe's, Weekend Trip"
          className="input"
          autoFocus
        />
      </div>

      {/* Members */}
      <div className="card p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--text-primary)]">
            Members
          </label>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Add everyone who will split bills in this group
          </p>
        </div>

        <div className="space-y-3">
          {members.map((member, index) => (
            <div
              key={index}
              className="flex items-center gap-3 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {member.trim()
                  ? member.trim().charAt(0).toUpperCase()
                  : index + 1}
              </div>
              <input
                type="text"
                value={member}
                onChange={(e) => updateMember(index, e.target.value)}
                placeholder={`Person ${index + 1}`}
                className="input flex-1"
              />
              {members.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addMember}
          className="mt-4 w-full py-3 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add another person
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Creating group...
          </>
        ) : (
          <>
            Create Group
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </form>
  )
}

/* ── Splitwise Import Flow ── */

function SplitwiseImport() {
  const router = useRouter()
  const [groups, setGroups] = useState<SplitwiseGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<SplitwiseGroup | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState('')
  const [notConnected, setNotConnected] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  // Fetch groups on mount
  useEffect(() => {
    fetch('/api/splitwise/groups')
      .then((res) => {
        if (res.status === 401 || res.status === 400) {
          setNotConnected(true)
          return null
        }
        if (!res.ok) throw new Error('Failed to fetch Splitwise groups')
        return res.json()
      })
      .then((data) => {
        if (data) setGroups(data.groups)
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : 'Failed to load groups',
        ),
      )
      .finally(() => {
        setIsLoading(false)
        setHasFetched(true)
      })
  }, [])

  const handleImport = async () => {
    if (!selectedGroup) return
    setIsImporting(true)
    setError('')

    try {
      const res = await fetch('/api/groups/import/splitwise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ splitwiseGroupId: selectedGroup.id }),
      })

      const data = await res.json()

      if (res.status === 409) {
        // Already imported — redirect to existing group
        router.push(`/groups/${data.groupId}`)
        return
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to import group')
      }

      router.push(`/groups/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
      setIsImporting(false)
    }
  }

  // Not connected state
  if (notConnected) {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#5BC5A7]/10 flex items-center justify-center mx-auto mb-4">
          <Link2 className="h-8 w-8 text-[#5BC5A7]" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          Connect Splitwise First
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
          To import groups from Splitwise, you need to connect your account
          first.
        </p>
        <Link href="/settings" className="btn btn-primary">
          <Settings className="h-4 w-4" />
          Go to Settings
        </Link>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="card p-8 flex items-center justify-center text-[var(--text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading Splitwise groups...
      </div>
    )
  }

  // Error state
  if (error && !hasFetched) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--error)] p-4 rounded-xl bg-[var(--error)]/5">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        {error}
      </div>
    )
  }

  // Preview selected group
  if (selectedGroup) {
    return (
      <div className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 text-sm text-[var(--error)] p-3 rounded-lg bg-[var(--error)]/5">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => {
                setSelectedGroup(null)
                setError('')
              }}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-[var(--text-muted)]" />
            </button>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Import Preview
            </h2>
          </div>

          {/* Group name */}
          <div className="mb-4">
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Group Name
            </label>
            <p className="text-base font-medium text-[var(--text-primary)]">
              {selectedGroup.name}
            </p>
          </div>

          {/* Members preview */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-2">
              Members ({selectedGroup.members.length})
            </label>
            <div className="space-y-2">
              {selectedGroup.members.map((m) => {
                const fullName =
                  [m.first_name, m.last_name]
                    .filter(Boolean)
                    .join(' ')
                    .trim() || 'Unknown'
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--surface-hover)]"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {fullName}
                      </p>
                      {m.email && (
                        <p className="text-xs text-[var(--text-muted)] truncate">
                          {m.email}
                        </p>
                      )}
                    </div>
                    <CheckCircle className="h-4 w-4 text-[#5BC5A7] flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)] mt-4">
            All members will be automatically linked to their Splitwise
            accounts. No manual mapping needed when exporting.
          </p>
        </div>

        <button
          type="button"
          onClick={handleImport}
          disabled={isImporting}
          className="btn btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              Import Group
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    )
  }

  // Group list
  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-sm text-[var(--error)] p-3 rounded-lg bg-[var(--error)]/5">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#5BC5A7]/10 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-[#5BC5A7] opacity-50" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            No Splitwise Groups
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            You don&apos;t have any groups on Splitwise yet. Create one there
            first, or use the manual option.
          </p>
        </div>
      ) : (
        <div className="card p-4">
          <p className="text-xs text-[var(--text-muted)] mb-3 px-2">
            Select a Splitwise group to import
          </p>
          <div className="space-y-2">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGroup(g)}
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
        </div>
      )}
    </div>
  )
}
