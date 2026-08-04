'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export function AdvancedAnalyticsSparkline({
  values,
  variant
}: {
  values: number[]
  variant: 'revenue' | 'traffic' | 'conversions' | 'suppliers'
}) {
  const safeValues = values.filter((v) => Number.isFinite(v) && v >= 0)
  const max = safeValues.length ? Math.max(...safeValues) : 0

  const barCount = 8
  const sample = React.useMemo(() => {
    if (safeValues.length === 0) return Array.from({ length: barCount }).map(() => 0)
    const out = Array.from({ length: barCount }).map(() => 0)
    for (let i = 0; i < barCount; i++) {
      const startIdx = Math.floor((i * safeValues.length) / barCount)
      const endIdx = Math.max(startIdx + 1, Math.floor(((i + 1) * safeValues.length) / barCount))
      let sum = 0
      for (let j = startIdx; j < Math.min(endIdx, safeValues.length); j++) sum += safeValues[j] ?? 0
      out[i] = sum
    }
    return out
  }, [safeValues])

  const colorClass =
    variant === 'revenue'
      ? 'bg-primary'
      : variant === 'traffic'
        ? 'bg-primary'
        : variant === 'conversions'
          ? 'bg-indigo-600 dark:bg-indigo-400'
          : 'bg-emerald-600'

  return (
    <div className="mt-4 h-10 w-full relative">
      <div className="absolute inset-0 flex items-end gap-1">
        {sample.map((v, idx) => {
          const pct = max > 0 ? v / max : 0
          const stepMax = 9
          const step = Math.min(stepMax, Math.max(0, Math.round(pct * stepMax)))
          const heightClasses = ['h-0', 'h-1', 'h-2', 'h-3', 'h-4', 'h-5', 'h-6', 'h-7', 'h-8', 'h-9']
          const heightClass = heightClasses[step] ?? 'h-0'
          return (
            <div
              key={`${variant}-${idx}`}
              className={cn('w-full rounded-t-sm', colorClass, heightClass)}
              aria-hidden
            />
          )
        })}
      </div>
    </div>
  )
}

export function AdvancedAnalyticsSparklineSkeleton() {
  return (
    <div className="mt-4 h-10 w-full relative" aria-hidden>
      <div className="absolute inset-0 flex items-end gap-1">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className={cn(
              'w-full rounded-t-sm bg-surface-container-highest animate-pulse',
              ['h-1', 'h-2', 'h-3', 'h-4', 'h-5', 'h-6', 'h-7', 'h-8'][idx] ?? 'h-1'
            )}
          />
        ))}
      </div>
    </div>
  )
}

