'use client'

import { Bolt } from 'lucide-react'

type GlobalSearchFooterProps = {
  hintSelect: string
  hintNavigate: string
  footerTag: string
}

export function GlobalSearchFooter({ hintSelect, hintNavigate, footerTag }: GlobalSearchFooterProps) {
  return (
    <div className="flex flex-col gap-2 border-t border-outline/15 bg-surface-container-low/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-on-surface-variant sm:text-xs">
        <span className="inline-flex items-center gap-1.5">
          <kbd className="rounded-md border border-outline/25 bg-background px-2 py-1 font-mono text-[10px] font-semibold text-on-surface shadow-sm">
            Enter
          </kbd>
          <span className="text-on-surface-variant">{hintSelect}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <kbd className="rounded-md border border-outline/25 bg-background px-2 py-1 font-mono text-[10px] font-semibold text-on-surface shadow-sm">
            ↑↓
          </kbd>
          <span className="text-on-surface-variant">{hintNavigate}</span>
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-primary">
        <Bolt className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="font-headline text-[10px] font-bold uppercase tracking-wider">{footerTag}</span>
      </div>
    </div>
  )
}
