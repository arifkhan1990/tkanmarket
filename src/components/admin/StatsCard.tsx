'use client'

import Link from 'next/link'

import {
  Bot,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  Megaphone,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
  type LucideIcon
} from 'lucide-react'

import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass, dashboardStatToneClasses, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import { cn } from '@/lib/utils'
import type { StatsCardIconName, StatsCardProps } from '@/types/admin.types'

const STATS_CARD_ICONS: Record<StatsCardIconName, LucideIcon> = {
  bot: Bot,
  'calendar-check2': CalendarCheck2,
  'check-circle2': CheckCircle2,
  clock: Clock,
  'file-text': FileText,
  flame: Flame,
  megaphone: Megaphone,
  'package-search': PackageSearch,
  'shield-check': ShieldCheck,
  sparkles: Sparkles,
  target: Target,
  'x-circle': XCircle
}

function formatStatValue(value: number | string): string {
  if (typeof value === 'number' && Number.isFinite(value)) return value.toLocaleString()
  return String(value)
}

function ChangeBadge({ change }: { change: number | undefined }) {
  if (typeof change !== 'number') return null
  const isUp = change >= 0
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold tabular-nums',
        isUp
          ? 'bg-emerald-500/12 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200'
          : 'bg-red-500/12 text-red-800 dark:bg-red-400/15 dark:text-red-200'
      )}
    >
      {isUp ? <TrendingUp className="h-3.5 w-3.5" aria-hidden /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden />}
      {Math.abs(change).toFixed(1)}%
    </div>
  )
}

export function StatsCard({ title, value, change, icon, color, description, href, variant = 'default' }: StatsCardProps) {
  const tone = dashboardStatToneClasses[color]
  const Icon = STATS_CARD_ICONS[icon]
  const displayValue = formatStatValue(value)
  const compact = variant === 'compact'

  const body = compact ? (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]',
          'h-9 w-9',
          tone.iconWrap
        )}
        aria-hidden
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant line-clamp-2 leading-tight">
            {title}
          </p>
          <ChangeBadge change={change} />
        </div>
        <p className="mt-0.5 text-xl font-bold leading-none tracking-tight text-on-surface tabular-nums sm:text-2xl">
          {displayValue}
        </p>
        {description ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-on-surface-variant/90">{description}</p>
        ) : null}
      </div>
    </div>
  ) : (
    <>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]',
            tone.iconWrap
          )}
          aria-hidden
        >
          <Icon className="h-6 w-6" strokeWidth={2} />
        </div>
        <ChangeBadge change={change} />
      </div>
      <div className="mt-6 min-h-0">
        <p className={dashboardStatLabelClass}>{title}</p>
        <p className={dashboardStatValueClass}>{displayValue}</p>
        {description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-on-surface-variant/90">{description}</p>
        ) : null}
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest"
        aria-label={`${title}: ${displayValue}`}
      >
        <DashboardStatCardShell tone={color} interactive compact={compact}>
          {body}
        </DashboardStatCardShell>
      </Link>
    )
  }

  return (
    <DashboardStatCardShell tone={color} compact={compact}>
      {body}
    </DashboardStatCardShell>
  )
}
