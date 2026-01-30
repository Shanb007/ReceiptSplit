'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Receipt, ArrowRight, Loader2 } from 'lucide-react'
import { ImageUploader } from '@/components/image-uploader'
import { PayerSelector } from '@/components/payer-selector'
import { ExtractionProgress } from '@/components/extraction-progress'

interface GroupData {
  id: string
  name: string
  members: { id: string; name: string }[]
}

export function ReceiptUploadForm({ group }: { group: GroupData }) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [payerId, setPayerId] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = selectedFile && payerId && !isProcessing

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsProcessing(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('groupId', group.id)
      formData.append('payerId', payerId)

      const res = await fetch('/api/receipts', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to process receipt')
      }

      const receipt = await res.json()
      router.push(`/groups/${group.id}/receipts/${receipt.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsProcessing(false)
    }
  }

  if (isProcessing) {
    return <ExtractionProgress />
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 flex items-center justify-center">
          <Receipt className="h-7 w-7 text-[var(--primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Upload Receipt</h1>
          <p className="text-[var(--text-secondary)]">{group.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-[var(--error)]/10 text-[var(--error)] px-4 py-3 rounded-xl text-sm animate-scale-in">
            {error}
          </div>
        )}

        {/* Who Paid */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Who paid?
          </label>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            Select the person who paid for this receipt
          </p>
          <PayerSelector
            members={group.members}
            selectedPayerId={payerId}
            onChange={setPayerId}
          />
        </div>

        {/* Receipt Image */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Receipt Photo
          </label>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            Take a photo or upload an image of the receipt
          </p>
          <ImageUploader
            onImageSelected={setSelectedFile}
            selectedFile={selectedFile}
            onClear={() => setSelectedFile(null)}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowRight className="h-5 w-5" />
          Process Receipt
        </button>

        <p className="text-xs text-center text-[var(--text-muted)]">
          AI will extract line items, prices, tax, and tip from your receipt
        </p>
      </form>
    </div>
  )
}
