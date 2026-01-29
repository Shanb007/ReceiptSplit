'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { ArrowLeft, Plus, X, Loader2, Users, Crown } from 'lucide-react'
import Link from 'next/link'

export default function NewGroupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [members, setMembers] = useState<string[]>(['', ''])
  const [payerIndex, setPayerIndex] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const addMember = () => {
    setMembers([...members, ''])
  }

  const removeMember = (index: number) => {
    if (members.length <= 2) return
    const newMembers = members.filter((_, i) => i !== index)
    setMembers(newMembers)
    if (payerIndex >= newMembers.length) {
      setPayerIndex(0)
    } else if (payerIndex > index) {
      setPayerIndex(payerIndex - 1)
    }
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
          members: validMembers.map((m, i) => ({
            name: m.trim(),
            isPayer: i === payerIndex,
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
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 flex items-center justify-center">
              <Users className="h-7 w-7 text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create New Group</h1>
              <p className="text-[var(--text-secondary)]">Add people to split bills with</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-[var(--error)]/10 text-[var(--error)] px-4 py-3 rounded-xl text-sm animate-scale-in">
                {error}
              </div>
            )}

            {/* Group Name */}
            <div className="card p-6">
              <label htmlFor="name" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)]">
                    Members
                  </label>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">
                    Click the crown to mark who paid
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {members.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <button
                      type="button"
                      onClick={() => setPayerIndex(index)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        payerIndex === index
                          ? 'bg-gradient-to-br from-[var(--accent)] to-[#f0c030] text-[#7a5a00] shadow-lg shadow-[var(--accent)]/30'
                          : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:bg-[var(--border)]'
                      }`}
                      title={payerIndex === index ? 'This person paid' : 'Click to mark as payer'}
                    >
                      <Crown className="h-5 w-5" />
                    </button>
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
                  <ArrowLeft className="h-5 w-5 rotate-180" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
