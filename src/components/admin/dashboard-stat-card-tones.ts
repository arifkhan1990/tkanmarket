import type { StatsCardColor } from '@/types/admin.types'

/** Shared visual tokens for dashboard metric cards (StatsCard + DashboardStatCardShell). */
export const dashboardStatToneClasses: Record<
  StatsCardColor,
  { iconWrap: string; blob: string; topAccent: string }
> = {
  blue: {
    iconWrap:
      'bg-blue-500/[0.12] text-blue-700 ring-blue-500/25 dark:bg-blue-400/15 dark:text-blue-300 dark:ring-blue-400/30',
    blob: 'from-blue-500/25 via-blue-400/10 to-transparent dark:from-blue-400/20',
    topAccent: 'before:via-blue-500/40 dark:before:via-blue-400/50'
  },
  green: {
    iconWrap:
      'bg-emerald-500/[0.12] text-emerald-700 ring-emerald-500/25 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/30',
    blob: 'from-emerald-500/25 via-emerald-400/10 to-transparent dark:from-emerald-400/20',
    topAccent: 'before:via-emerald-500/40 dark:before:via-emerald-400/50'
  },
  yellow: {
    iconWrap:
      'bg-amber-500/[0.14] text-amber-800 ring-amber-500/25 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/30',
    blob: 'from-amber-500/25 via-amber-400/10 to-transparent dark:from-amber-400/20',
    topAccent: 'before:via-amber-500/45 dark:before:via-amber-400/55'
  },
  red: {
    iconWrap:
      'bg-red-500/[0.12] text-red-700 ring-red-500/25 dark:bg-red-400/15 dark:text-red-300 dark:ring-red-400/30',
    blob: 'from-red-500/25 via-red-400/10 to-transparent dark:from-red-400/20',
    topAccent: 'before:via-red-500/40 dark:before:via-red-400/50'
  }
}

export const dashboardStatLabelClass =
  'text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant sm:text-[0.8125rem]'

/** Primary metric number — large, readable on all dashboard stat grids. */
export const dashboardStatValueClass =
  'mt-3 text-3xl font-bold leading-none tracking-tight text-on-surface tabular-nums sm:text-4xl'
