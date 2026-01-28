'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewGroupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [members, setMembers] = useState<string[]>([''])
  const [payerIndex, setPayerIndex] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const addMember = () => {
    setMembers([...members, ''])
  }

  const removeMember = (index: number) => {
    if (members.length <= 1) return
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
    if (validMembers.length < 1) {
      setError('Please add at least one member')
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
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
        <Link
          href="/groups"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to groups
        </Link>

        <h1 className="text-2xl font-bold mb-6">Create New Group</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Dinner at Joe's - Jan 24"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Members
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Add everyone who will split this bill. Click the radio to mark who paid.
            </p>

            <div className="space-y-2">
              {members.map((member, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="payer"
                    checked={payerIndex === index}
                    onChange={() => setPayerIndex(index)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    title="Mark as payer"
                  />
                  <input
                    type="text"
                    value={member}
                    onChange={(e) => updateMember(index, e.target.value)}
                    placeholder={`Member ${index + 1}`}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="p-2 text-gray-400 hover:text-red-500"
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
              className="mt-3 inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add another member
            </button>

            <p className="mt-2 text-xs text-gray-500">
              The selected radio indicates who paid the bill
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Group'
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
