'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import type { StatsCardColor } from '@/types/admin.types'

import { dashboardStatToneClasses } from './dashboard-stat-card-tones'

export function DashboardStatCardShell({
  tone,
  className,
  children,
  interactive,
  compact
}: {
  tone: StatsCardColor
  className?: string
  children: React.ReactNode
  interactive?: boolean
  /** Tighter padding and smaller decorative blob (used with compact StatsCard). */
  compact?: boolean
}) {
  const t = dashboardStatToneClasses[tone]

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm',
        compact ? 'p-3.5 sm:p-4' : 'min-h-[128px] p-6 sm:min-h-[140px] sm:p-7',
        'dark:border-outline/15 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]',
        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent',
        t.topAccent,
        !compact &&
          cn(
            'transition-all duration-300 ease-out will-change-transform',
            'hover:-translate-y-0.5 hover:border-outline/25 hover:shadow-lg',
            'hover:shadow-black/[0.08] dark:hover:border-outline/30 dark:hover:shadow-black/45',
            'focus-within:border-outline/25 focus-within:shadow-lg focus-within:shadow-black/[0.08]'
          ),
        interactive && 'cursor-pointer active:translate-y-0 active:shadow-md',
        className
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute rounded-full bg-gradient-to-br opacity-60 blur-3xl',
          compact ? '-right-4 -top-7 h-24 w-24' : '-right-8 -top-12 h-40 w-40 sm:h-44 sm:w-44',
          t.blob
        )}
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  )
}
