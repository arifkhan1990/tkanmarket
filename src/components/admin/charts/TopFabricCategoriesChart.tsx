'use client'

import { useMemo } from 'react'

import { useI18n } from '@/hooks/useI18n'
import type { TopFabricCategoriesPoint } from '@/types/admin-stats.types'
import { cn } from '@/lib/utils'

function formatCategoryLabel(slug: string) {
  return slug
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (m) => m.toUpperCase())
}

export function TopFabricCategoriesChart({ data }: { data: TopFabricCategoriesPoint[] }) {
  const { messages } = useI18n()
  const c = messages.admin.charts.topFabricCategories

  const max = useMemo(() => Math.max(0, ...data.map((d) => d.count)), [data])

  const widthClassForPct = (pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct))
    const step = Math.round(clamped / 10) * 10
    if (step <= 0) return 'w-[0%]'
    if (step <= 10) return 'w-[10%]'
    if (step <= 20) return 'w-[20%]'
    if (step <= 30) return 'w-[30%]'
    if (step <= 40) return 'w-[40%]'
    if (step <= 50) return 'w-[50%]'
    if (step <= 60) return 'w-[60%]'
    if (step <= 70) return 'w-[70%]'
    if (step <= 80) return 'w-[80%]'
    if (step <= 90) return 'w-[90%]'
    return 'w-[100%]'
  }

  if (data.length === 0 || max === 0) {
    return (
      <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6">
        <div className="text-sm font-semibold text-on-surface">{c.title}</div>
        <div className="mt-1 text-xs text-on-surface-variant">{c.subtitle}</div>
        <div className="mt-6 rounded-2xl border border-outline/10 bg-surface-container-highest p-10 text-center text-sm text-on-surface-variant">
          {c.empty}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-4">
      <div>
        <div className="text-sm font-semibold text-on-surface">{c.title}</div>
        <div className="mt-1 text-xs text-on-surface-variant">{c.subtitle}</div>
      </div>

      <div className="space-y-4">
        {data.map((p) => {
          const pct = Math.round((p.count / max) * 100)
          return (
            <div key={p.category} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-on-surface">{formatCategoryLabel(p.category)}</div>
                <div className="font-mono text-sm font-bold text-on-surface-variant">{p.count} items</div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                <div className={cn('h-full rounded-full bg-primary', widthClassForPct(pct))} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

