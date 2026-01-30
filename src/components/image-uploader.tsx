'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploaderProps {
  onImageSelected: (file: File) => void
  selectedFile: File | null
  onClear: () => void
  disabled?: boolean
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
const MAX_SIZE_MB = 10

export function ImageUploader({
  onImageSelected,
  selectedFile,
  onClear,
  disabled = false,
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateAndSet = useCallback(
    (file: File) => {
      setError('')

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Please upload a JPG, PNG, or HEIC image')
        return
      }

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Image must be under ${MAX_SIZE_MB}MB`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      onImageSelected(file)
    },
    [onImageSelected]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file) validateAndSet(file)
    },
    [disabled, validateAndSet]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndSet(file)
  }

  const handleClear = () => {
    setPreview(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClear()
  }

  if (selectedFile && preview) {
    return (
      <div className="relative animate-scale-in">
        <div className="card p-3">
          <div className="relative rounded-xl overflow-hidden bg-[var(--surface-hover)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Receipt preview"
              className="w-full max-h-80 object-contain"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 mt-3 px-1">
            <ImageIcon className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
            <span className="text-sm text-[var(--text-secondary)] truncate">
              {selectedFile.name}
            </span>
            <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
              {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer
          ${isDragOver
            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
            : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/3'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 flex items-center justify-center">
            {isDragOver ? (
              <Upload className="h-8 w-8 text-[var(--primary)] animate-bounce" />
            ) : (
              <Camera className="h-8 w-8 text-[var(--primary)]" />
            )}
          </div>

          <div>
            <p className="font-semibold text-[var(--text-primary)]">
              {isDragOver ? 'Drop your receipt here' : 'Upload receipt photo'}
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              JPG, PNG, or HEIC up to {MAX_SIZE_MB}MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-[var(--error)]/10 text-[var(--error)] px-4 py-3 rounded-xl text-sm animate-scale-in mt-3">
          {error}
        </div>
      )}
    </div>
  )
}
