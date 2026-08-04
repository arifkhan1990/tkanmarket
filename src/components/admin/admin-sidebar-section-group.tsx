'use client'

import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

export function AdminSidebarSectionGroup({
  title,
  open,
  onToggle,
  children
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-outline/10 bg-surface-container-low dark:bg-surface-container-low">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 rounded-t-xl px-3 py-2 text-left text-on-surface transition-colors hover:bg-surface-container-high/80"
        aria-expanded={open}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-on-surface">{title}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-on-surface-variant transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-outline/10 px-1.5 pb-2 pt-1">
          <div className="flex flex-col gap-0.5">{children}</div>
        </div>
      ) : null}
    </div>
  )
}
