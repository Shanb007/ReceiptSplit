'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Users, Receipt, Calendar, DollarSign, ChevronRight, Camera, Trash2, Loader2 } from 'lucide-react'
import { EditableText } from '@/components/editable-text'
import { MemberCard, type SerializedMember } from '@/components/member-card'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface ReceiptData {
  id: string
  merchantName: string | null
  receiptDate: string | null
  subtotal: number | null
  tax: number | null
  tip: number | null
  total: number | null
  status: string
  createdAt: string
}

interface GroupData {
  id: string
  name: string
  createdAt: string
  members: SerializedMember[]
  receipts: ReceiptData[]
}

function formatCents(cents: number | null): string {
  if (cents === null) return '-'
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function getStatusConfig(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pending', className: 'badge-muted' },
    PROCESSING: { label: 'Processing', className: 'bg-blue-100 text-blue-700' },
    REVIEW: { label: 'Review', className: 'badge-warning' },
    SPLITTING: { label: 'Splitting', className: 'bg-purple-100 text-purple-700' },
    SETTLED: { label: 'Settled', className: 'badge-success' },
    EXPORTED: { label: 'Exported', className: 'badge-success' },
  }
  return statusMap[status] || statusMap.PENDING
}

export function GroupDetailClient({ group: initialGroup }: { group: GroupData }) {
  const router = useRouter()
  const [group, setGroup] = useState(initialGroup)
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false)
  const [isDeletingGroup, setIsDeletingGroup] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [error, setError] = useState('')

  const handleEditGroupName = async (newName: string) => {
    const res = await fetch(`/api/groups/${group.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to update group name')
    }
    setGroup((prev) => ({ ...prev, name: newName }))
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newMemberName.trim()
    if (!trimmed) return

    setIsAddingMember(true)
    setError('')
    try {
      const res = await fetch(`/api/groups/${group.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add member')
      }
      const newMember = await res.json()
      setGroup((prev) => ({ ...prev, members: [...prev.members, newMember] }))
      setNewMemberName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleMemberUpdated = (updatedMember: SerializedMember) => {
    setGroup((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === updatedMember.id ? updatedMember : m)),
    }))
  }

  const handleMemberDeleted = (memberId: string) => {
    setGroup((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== memberId),
    }))
  }

  const handleDeleteGroup = async () => {
    setIsDeletingGroup(true)
    try {
      const res = await fetch(`/api/groups/${group.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete group')
      }
      router.push('/groups')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group')
      setShowDeleteGroupConfirm(false)
      setIsDeletingGroup(false)
    }
  }

  return (
    <>
      {error && (
        <div className="bg-[var(--error)]/10 text-[var(--error)] px-4 py-3 rounded-xl text-sm animate-scale-in mb-6">
          {error}
        </div>
      )}

      {/* Group Header Card */}
      <div className="card p-8 mb-8 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-8 w-8 text-[var(--primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <EditableText
              value={group.name}
              onSave={handleEditGroupName}
              className="text-2xl font-bold text-[var(--text-primary)]"
              as="h1"
            />
            <p className="text-[var(--text-secondary)] text-sm mt-2">
              Created {formatDate(group.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteGroupConfirm(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors flex-shrink-0"
            title="Delete group"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        {/* Members */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
            {group.members.length} {group.members.length === 1 ? 'Member' : 'Members'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {group.members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                groupId={group.id}
                isOnlyMember={group.members.length <= 1}
                onMemberUpdated={handleMemberUpdated}
                onMemberDeleted={handleMemberDeleted}
              />
            ))}
          </div>

          {/* Add Member */}
          <form onSubmit={handleAddMember} className="flex items-center gap-2 mt-4">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Add a member..."
              disabled={isAddingMember}
              className="input py-2 px-3 text-sm flex-1 max-w-xs"
            />
            <button
              type="submit"
              disabled={isAddingMember || !newMemberName.trim()}
              className="btn btn-primary py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingMember ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Receipts Section */}
      <div className="flex items-center justify-between mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Receipts</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">
            {group.receipts.length === 0
              ? 'No receipts yet'
              : `${group.receipts.length} receipt${group.receipts.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Link href={`/groups/${group.id}/receipts/new`} className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Add Receipt
        </Link>
      </div>

      {group.receipts.length === 0 ? (
        <div className="card p-12 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--secondary)]/10 to-[var(--secondary)]/5 flex items-center justify-center mx-auto mb-6">
            <Camera className="h-10 w-10 text-[var(--secondary)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No receipts yet</h3>
          <p className="text-[var(--text-secondary)] mb-8 max-w-sm mx-auto">
            Upload a receipt photo and let AI extract all the items for splitting
          </p>
          <Link href={`/groups/${group.id}/receipts/new`} className="btn btn-primary">
            <Camera className="h-4 w-4" />
            Upload First Receipt
          </Link>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {group.receipts.map((receipt) => {
            const statusConfig = getStatusConfig(receipt.status)
            return (
              <Link
                key={receipt.id}
                href={`/groups/${group.id}/receipts/${receipt.id}`}
                className="card card-interactive p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-[var(--primary)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {receipt.merchantName || 'Untitled Receipt'}
                      </span>
                      <span className={`badge ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                      {receipt.receiptDate && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(receipt.receiptDate)}
                        </span>
                      )}
                      {receipt.total && (
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5" />
                          {formatCents(receipt.total)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-[var(--text-muted)]" />
              </Link>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={showDeleteGroupConfirm}
        title="Delete Group"
        description={`Are you sure you want to delete "${group.name}" and all its data? This action cannot be undone.`}
        confirmLabel="Delete Group"
        variant="danger"
        loading={isDeletingGroup}
        onConfirm={handleDeleteGroup}
        onCancel={() => setShowDeleteGroupConfirm(false)}
      />
    </>
  )
}
