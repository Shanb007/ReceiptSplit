'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Link2,
  Link2Off,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react'

interface SettingsClientProps {
  splitwiseConnected: boolean
  splitwiseUserName: string | null
  splitwiseEmail: string | null
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_params: 'Missing authorization parameters. Please try again.',
  state_mismatch: 'Security validation failed. Please try again.',
  token_exchange_failed: 'Could not connect to Splitwise. Please try again.',
  user_fetch_failed: 'Connected but could not fetch your Splitwise profile.',
  init_failed: 'Could not start Splitwise connection. Please try again.',
  unexpected: 'An unexpected error occurred. Please try again.',
}

export function SettingsClient({
  splitwiseConnected: initialConnected,
  splitwiseUserName,
  splitwiseEmail,
}: SettingsClientProps) {
  const searchParams = useSearchParams()
  const [connected, setConnected] = useState(initialConnected)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const splitwiseStatus = searchParams.get('splitwise')
  const errorReason = searchParams.get('reason')

  const showSuccess = splitwiseStatus === 'connected'
  const showError = splitwiseStatus === 'error'
  const errorMessage = errorReason
    ? ERROR_MESSAGES[errorReason] || ERROR_MESSAGES.unexpected
    : null

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      const res = await fetch('/api/auth/splitwise/disconnect', {
        method: 'POST',
      })
      if (res.ok) {
        setConnected(false)
      }
    } catch {
      // ignore
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Success banner */}
      {showSuccess && connected && (
        <div className="flex items-center gap-2 text-sm text-[var(--success)] p-3 rounded-lg bg-[var(--success)]/5 animate-fade-in-up">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          Splitwise connected successfully!
        </div>
      )}

      {/* Error banner */}
      {showError && errorMessage && (
        <div className="flex items-center gap-2 text-sm text-[var(--error)] p-3 rounded-lg bg-[var(--error)]/5 animate-fade-in-up">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Splitwise Integration Card */}
      <div className="card p-6 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5BC5A7]/10 to-[#5BC5A7]/5 flex items-center justify-center flex-shrink-0">
            <ExternalLink className="h-6 w-6 text-[#5BC5A7]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Splitwise Integration
              </h2>
              <span
                className={`badge ${
                  connected ? 'badge-success' : 'badge-secondary'
                }`}
              >
                {connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {connected
                ? 'Your Splitwise account is linked. You can export settled receipts directly.'
                : 'Connect your Splitwise account to export settled receipts as shared expenses.'}
            </p>

            {/* Connected — show user info */}
            {connected && splitwiseUserName && (
              <div className="mt-4 p-3 rounded-xl bg-[var(--surface-hover)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#5BC5A7] flex items-center justify-center text-white text-sm font-semibold">
                    {splitwiseUserName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {splitwiseUserName}
                    </p>
                    {splitwiseEmail && (
                      <p className="text-xs text-[var(--text-muted)]">
                        {splitwiseEmail}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-4">
              {connected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="btn btn-secondary text-[var(--error)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2Off className="h-4 w-4" />
                  )}
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect Splitwise'}
                </button>
              ) : (
                <a
                  href="/api/auth/splitwise"
                  className="btn btn-primary inline-flex"
                >
                  <Link2 className="h-4 w-4" />
                  Connect Splitwise
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
