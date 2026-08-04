'use client'

import * as React from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

export function AlertsSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-10 w-2/3 rounded-xl bg-surface-container-high" />
      <div className="mb-4 flex items-center justify-between">
        <div className="h-7 w-48 rounded-lg bg-surface-container-high" />
        <div className="h-6 w-28 rounded-full bg-surface-container-high" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-xl bg-surface-container-high shadow-[0_20px_50px_rgba(24,28,32,0.04)]"
          />
        ))}
      </div>
    </div>
  )
}

export function StatusPill({ status }: { status: 'operational' | 'warning' | 'failed' }) {
  const { messages } = useI18n()
  const p = messages.admin.systemAlertsPage
  const map = {
    operational: {
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
      t: p.statusOk
    },
    warning: {
      className: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
      t: p.statusWarn
    },
    failed: { className: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300', t: p.statusFail }
  }
  const x = map[status]
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold', x.className)}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {x.t}
    </span>
  )
}

export function TriggerCard({
  title,
  description,
  borderClass,
  iconWrapperClassName,
  icon,
  enabled,
  onEnabledChange,
  footer
}: {
  title: string
  description: string
  borderClass: string
  iconWrapperClassName?: string
  icon: React.ReactNode
  enabled: boolean
  onEnabledChange: (v: boolean) => void
  footer: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'space-y-4 rounded-xl border border-outline/10 bg-surface-container-lowest p-6 shadow-[0_20px_50px_rgba(24,28,32,0.04)]',
        borderClass
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            iconWrapperClassName ?? 'bg-surface-container-high text-on-surface'
          )}
        >
          {icon}
        </div>
        <Checkbox checked={enabled} onCheckedChange={(c) => onEnabledChange(c === true)} aria-label={title} />
      </div>
      <div>
        <h3 className="font-heading font-bold text-on-surface">{title}</h3>
        <p className="mt-1 text-xs text-on-surface-variant">{description}</p>
      </div>
      <div className="border-t border-outline/10 pt-3">{footer}</div>
    </div>
  )
}

export function RangeRow({
  label,
  value,
  min,
  max,
  format,
  onChange,
  hint
}: {
  label: string
  value: number
  min: number
  max: number
  format: (n: number) => string
  onChange: (n: number) => void
  hint: string
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] font-medium uppercase tracking-tighter text-outline">
        <span>{label}</span>
        <span className="font-bold text-on-surface">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-primary"
      />
      <p className="mt-1 text-[10px] text-on-surface-variant">{hint}</p>
    </div>
  )
}

export function DeliveryRow({
  icon,
  title,
  subtitle,
  enabled,
  onEnabledChange,
  extra
}: {
  icon?: React.ReactNode
  title: string
  subtitle: string
  enabled: boolean
  onEnabledChange: (v: boolean) => void
  extra?: React.ReactNode
}) {
  return (
    <div className="border-b border-outline/10 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          {icon ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            <h3 className="font-heading text-sm font-bold text-on-surface">{title}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{subtitle}</p>
          </div>
        </div>
        <Checkbox checked={enabled} onCheckedChange={(c) => onEnabledChange(c === true)} aria-label={title} />
      </div>
      {extra}
    </div>
  )
}
