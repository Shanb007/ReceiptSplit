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
  Key,
  Trash2,
  Zap,
} from 'lucide-react'

interface SettingsClientProps {
  splitwiseConnected: boolean
  splitwiseUserName: string | null
  splitwiseEmail: string | null
  hasApiKey: boolean
  scansUsed: number
  scanLimit: number
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
  hasApiKey: initialHasKey,
  scansUsed,
  scanLimit,
}: SettingsClientProps) {
  const searchParams = useSearchParams()
  const [connected, setConnected] = useState(initialConnected)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  // API key state
  const [hasKey, setHasKey] = useState(initialHasKey)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [isSavingKey, setIsSavingKey] = useState(false)
  const [isRemovingKey, setIsRemovingKey] = useState(false)
  const [keyError, setKeyError] = useState('')
  const [keySuccess, setKeySuccess] = useState('')

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

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) return
    setIsSavingKey(true)
    setKeyError('')
    setKeySuccess('')

    try {
      const res = await fetch('/api/settings/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save API key')
      }

      setHasKey(true)
      setApiKeyInput('')
      setKeySuccess('API key saved successfully. You now have unlimited scans.')
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'Failed to save API key')
    } finally {
      setIsSavingKey(false)
    }
  }

  const handleRemoveKey = async () => {
    setIsRemovingKey(true)
    setKeyError('')
    setKeySuccess('')

    try {
      const res = await fetch('/api/settings/api-key', {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to remove API key')
      }

      setHasKey(false)
      setKeySuccess('API key removed.')
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'Failed to remove API key')
    } finally {
      setIsRemovingKey(false)
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

      {/* OpenAI API Key Card */}
      <div className="card p-6 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 flex items-center justify-center flex-shrink-0">
            <Key className="h-6 w-6 text-[var(--primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                OpenAI API Key
              </h2>
              {hasKey && (
                <span className="badge badge-success">Active</span>
              )}
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {hasKey
                ? 'Your API key is set. You have unlimited receipt scans.'
                : 'Add your own OpenAI API key for unlimited receipt scans. Without one, you get 5 free scans per month.'}
            </p>

            {/* Scan Usage */}
            <div className="mt-4 p-3 rounded-xl bg-[var(--surface-hover)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    Scan usage this month
                  </span>
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {hasKey ? 'Unlimited' : `${scansUsed} / ${scanLimit}`}
                </span>
              </div>
              {!hasKey && (
                <div className="mt-2 w-full bg-[var(--surface)] rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      scansUsed >= scanLimit
                        ? 'bg-[var(--error)]'
                        : scansUsed >= scanLimit - 1
                          ? 'bg-[var(--warning)]'
                          : 'bg-[var(--primary)]'
                    }`}
                    style={{ width: `${Math.min((scansUsed / scanLimit) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Key error/success messages */}
            {keyError && (
              <div className="mt-3 text-sm text-[var(--error)] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {keyError}
              </div>
            )}
            {keySuccess && (
              <div className="mt-3 text-sm text-[var(--success)] flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                {keySuccess}
              </div>
            )}

            {/* Key input or remove */}
            <div className="mt-4">
              {hasKey ? (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  disabled={isRemovingKey}
                  className="btn btn-secondary text-[var(--error)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRemovingKey ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {isRemovingKey ? 'Removing...' : 'Remove API Key'}
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="sk-..."
                    className="input flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleSaveKey}
                    disabled={isSavingKey || !apiKeyInput.trim()}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingKey ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-[var(--text-muted)] mt-3">
              Your key is encrypted and stored securely. Get one at{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] underline"
              >
                platform.openai.com
              </a>
            </p>
          </div>
        </div>
      </div>

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
