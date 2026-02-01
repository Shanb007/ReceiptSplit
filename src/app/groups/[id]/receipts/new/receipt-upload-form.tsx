'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Receipt, ArrowRight, Loader2, Camera, PenLine, AlertTriangle, Settings } from 'lucide-react'
import { ImageUploader } from '@/components/image-uploader'
import { PayerSelector } from '@/components/payer-selector'
import { ExtractionProgress } from '@/components/extraction-progress'
import Link from 'next/link'

interface GroupData {
  id: string
  name: string
  members: { id: string; name: string }[]
}

type Mode = 'scan' | 'manual'

export function ReceiptUploadForm({
  group,
  scanLimit,
  scansUsed,
  hasApiKey,
}: {
  group: GroupData
  scanLimit: number
  scansUsed: number
  hasApiKey: boolean
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('scan')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [payerId, setPayerId] = useState('')
  const [merchantName, setMerchantName] = useState('')
  const [receiptDate, setReceiptDate] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const scansRemaining = hasApiKey ? Infinity : scanLimit - scansUsed
  const atLimit = !hasApiKey && scansRemaining <= 0

  const canSubmitScan = selectedFile && payerId && !isProcessing && !atLimit
  const canSubmitManual = payerId && !isProcessing

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'scan') {
      if (!canSubmitScan) return
      setIsProcessing(true)
      setError('')

      try {
        const formData = new FormData()
        formData.append('image', selectedFile!)
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
    } else {
      if (!canSubmitManual) return
      setIsProcessing(true)
      setError('')

      try {
        const res = await fetch('/api/receipts/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId: group.id,
            payerId,
            merchantName: merchantName || undefined,
            receiptDate: receiptDate || undefined,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create receipt')
        }

        const receipt = await res.json()
        router.push(`/groups/${group.id}/receipts/${receipt.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setIsProcessing(false)
      }
    }
  }

  if (isProcessing && mode === 'scan') {
    return <ExtractionProgress />
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 flex items-center justify-center">
          <Receipt className="h-7 w-7 text-[var(--primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">New Receipt</h1>
          <p className="text-[var(--text-secondary)]">{group.name}</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1 p-1 bg-[var(--surface)] rounded-xl mb-6">
        <button
          type="button"
          onClick={() => setMode('scan')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            mode === 'scan'
              ? 'bg-[var(--card)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <Camera className="h-4 w-4" />
          Scan Receipt
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            mode === 'manual'
              ? 'bg-[var(--card)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <PenLine className="h-4 w-4" />
          Enter Manually
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-[var(--error)]/10 text-[var(--error)] px-4 py-3 rounded-xl text-sm animate-scale-in">
            {error}
          </div>
        )}

        {/* Scan limit warning */}
        {mode === 'scan' && atLimit && (
          <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/20 px-4 py-4 rounded-xl animate-scale-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-[var(--warning)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Free scan limit reached
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  You&apos;ve used all {scanLimit} free scans this month. Add your own OpenAI API key in{' '}
                  <Link href="/settings" className="text-[var(--primary)] underline">
                    Settings
                  </Link>{' '}
                  for unlimited scans, or enter items manually below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scan usage info */}
        {mode === 'scan' && !atLimit && !hasApiKey && (
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 px-1">
            <Settings className="h-3 w-3" />
            {scansRemaining} of {scanLimit} free scans remaining this month
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

        {mode === 'scan' ? (
          <>
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
              disabled={!canSubmitScan}
              className="btn btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="h-5 w-5" />
              Process Receipt
            </button>

            <p className="text-xs text-center text-[var(--text-muted)]">
              AI will extract line items, prices, tax, and tip from your receipt
            </p>
          </>
        ) : (
          <>
            {/* Manual Entry Fields */}
            <div className="card p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Merchant Name
                  <span className="text-[var(--text-muted)] font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="e.g. Pizza Hut"
                  className="input w-full"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Date
                  <span className="text-[var(--text-muted)] font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmitManual}
              className="btn btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )}
              {isProcessing ? 'Creating...' : 'Create Receipt'}
            </button>

            <p className="text-xs text-center text-[var(--text-muted)]">
              You&apos;ll add line items on the next screen
            </p>
          </>
        )}
      </form>
    </div>
  )
}
