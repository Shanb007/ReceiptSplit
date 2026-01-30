'use client'

import { useState, useEffect } from 'react'
import { Loader2, Camera, FileText, CheckCircle2 } from 'lucide-react'

const STEPS = [
  { label: 'Uploading image...', icon: Camera },
  { label: 'Analyzing receipt with AI...', icon: FileText },
  { label: 'Extracting line items...', icon: FileText },
  { label: 'Almost done...', icon: CheckCircle2 },
]

export function ExtractionProgress() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setCurrentStep(1), 2000),
      setTimeout(() => setCurrentStep(2), 6000),
      setTimeout(() => setCurrentStep(3), 12000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const CurrentIcon = STEPS[currentStep].icon

  return (
    <div className="card p-12 text-center animate-fade-in-up">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 flex items-center justify-center">
            <CurrentIcon className="h-10 w-10 text-[var(--primary)]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--surface)] border-2 border-[var(--border)] flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Processing Receipt
          </h3>
          <p className="text-[var(--text-secondary)] animate-pulse">
            {STEPS[currentStep].label}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mt-2">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index <= currentStep
                  ? 'w-8 bg-[var(--primary)]'
                  : 'w-4 bg-[var(--border)]'
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-[var(--text-muted)] mt-2">
          This may take a few seconds depending on the receipt
        </p>
      </div>
    </div>
  )
}
