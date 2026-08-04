import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function fmtUsd(n: number, locale: string, compact = false) {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard'
  }).format(n)
}

export function fmtNum(n: number, locale: string, compact = false) {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US', {
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard'
  }).format(n)
}

export function fmtPct(n: number | null) {
  if (n == null) return '—'
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

export type DeltaTone = 'up-good' | 'down-good'

export function deltaClasses(value: number | null | undefined, tone: DeltaTone) {
  const v = value ?? 0
  const positive = tone === 'up-good' ? v >= 0 : v <= 0
  return positive
    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
    : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '')
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(',')
    )
    .join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function KpiCard(props: {
  label: string
  hint: string
  value: string
  delta: number | null
  tone: DeltaTone
  icon: ReactNode
  iconClass: string
  spark: { date: string; value: number }[]
  sparkColor: string
  vsPrev: string
}) {
  const { label, hint, value, delta, tone, icon, iconClass, spark, sparkColor, vsPrev } = props
  return (
    <div className={cn('flex flex-col rounded-xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm')}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className={cn('rounded-xl p-3', iconClass)}>{icon}</div>
        <span className={cn('shrink-0 rounded-full px-2 py-1 text-xs font-bold', deltaClasses(delta, tone))}>
          {fmtPct(delta)}
        </span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-outline">{label}</p>
      <p className="mt-1 font-mono text-2xl font-black text-on-surface md:text-3xl">{value}</p>
      <div className="mt-3 min-h-10 w-full">
        {spark.length > 1 ? <KpiSparkline data={spark} color={sparkColor} /> : null}
      </div>
      <p className="mt-2 text-xs text-outline">
        {hint} <span className="opacity-70">· {vsPrev}</span>
      </p>
    </div>
  )
}

function KpiSparkline({ data, color }: { data: { date: string; value: number }[]; color: string }) {
  const w = 120
  const h = 36
  const vals = data.map((d) => d.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const pad = max === min ? 1 : max - min
  const pts = data
    .map((d, i) => {
      const x = (i / Math.max(1, data.length - 1)) * w
      const y = h - ((d.value - min) / pad) * (h - 4) - 2
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible" aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={pts} />
    </svg>
  )
}
