'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Search } from 'lucide-react'
import * as React from 'react'

import { invPanelFlat, invText } from '@/components/admin/inventory-suite/inventory-suite-styles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Messages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import type { Locale } from '@/types/i18n.types'
import { cn } from '@/lib/utils'
import type { AdminSalesPerformanceResponse, AdminSalesTopRepresentativeRow } from '@/types/admin-sales-performance.types'

import { fmtUsd } from './sales-performance-format'

type T = Messages['admin']['salesPerformancePage']

export function SalesPerformanceRepsSection(props: {
  d: AdminSalesPerformanceResponse
  locale: Locale
  t: T
}) {
  const { d, locale, t } = props
  const [repSearch, setRepSearch] = React.useState('')

  const filteredReps = React.useMemo<AdminSalesTopRepresentativeRow[]>(() => {
    const reps = d.topRepresentatives
    if (!repSearch.trim()) return reps
    const needle = repSearch.trim().toLowerCase()
    return reps.filter(
      (r) =>
        r.name.toLowerCase().includes(needle) ||
        r.regionLabel.toLowerCase().includes(needle) ||
        r.role.toLowerCase().includes(needle)
    )
  }, [d.topRepresentatives, repSearch])

  const repTotalGross = React.useMemo(
    () => d.topRepresentatives.reduce((acc, r) => acc + r.grossSalesUsd, 0),
    [d.topRepresentatives]
  )

  return (
    <section className={cn(invPanelFlat(), 'overflow-hidden')}>
      <div className="flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className={cn('text-2xl font-extrabold tracking-tight', invText.title)}>{t.topRepsTitle}</h2>
          <p className={cn('mt-1 text-sm', invText.muted)}>{t.topRepsSubtitle}</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            aria-hidden
          />
          <Input
            type="search"
            value={repSearch}
            onChange={(e) => setRepSearch(e.target.value)}
            placeholder={t.searchRepsPlaceholder}
            className="h-11 rounded-xl pl-10"
            aria-label={t.searchRepsPlaceholder}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">{t.rankColumn}</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">{t.colRep}</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">{t.colRegion}</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">{t.colGross}</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">{t.shareOfTotal}</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">{t.colDeals}</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">{t.colPerformance}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10">
            {filteredReps.length === 0 ? (
              <tr>
                <td colSpan={7} className={cn('px-6 py-12 text-center text-sm', invText.muted)}>
                  {repSearch ? t.noRepsMatch : t.noReps}
                </td>
              </tr>
            ) : (
              filteredReps.map((rep) => {
                const share = repTotalGross > 0 ? (rep.grossSalesUsd / repTotalGross) * 100 : 0
                const originalRank = d.topRepresentatives.findIndex((r) => r.userId === rep.userId) + 1
                return (
                  <tr key={rep.userId} className="transition-colors hover:bg-surface-container-low/80">
                    <td className="px-6 py-5">
                      <span
                        className={cn(
                          'inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-black',
                          originalRank === 1 && 'bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100',
                          originalRank === 2 && 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
                          originalRank === 3 && 'bg-orange-200 text-orange-900 dark:bg-orange-900/50 dark:text-orange-100',
                          originalRank > 3 && 'bg-surface-container-high text-on-surface-variant'
                        )}
                      >
                        {originalRank}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
                          {rep.avatarUrl ? (
                            <Image src={rep.avatarUrl} alt={rep.name} fill className="object-cover" sizes="36px" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-on-surface-variant">
                              {rep.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{rep.name}</p>
                          <p className="truncate text-xs text-on-surface-variant">{rep.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium">{rep.regionLabel}</td>
                    <td className="px-6 py-5 font-mono text-sm font-bold">{fmtUsd(rep.grossSalesUsd, locale, true)}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 max-w-[40%] overflow-hidden rounded-full bg-surface-container-high sm:w-32">
                          <div
                            className="h-full min-w-[2px] rounded-full bg-brand-500 dark:bg-brand-400"
                            style={{ width: `${Math.max(2, Math.min(100, share))}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-on-surface-variant">{share.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold">{rep.wonDeals}</td>
                    <td className="px-6 py-5 text-right">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-3 py-1 text-xs font-black',
                          rep.performanceBand === 'EXCEEDING' &&
                            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
                          rep.performanceBand === 'ON_TARGET' &&
                            'bg-brand-100 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300',
                          rep.performanceBand === 'DEVELOPING' && 'bg-surface-container-high text-on-surface'
                        )}
                      >
                        {rep.performanceBand === 'EXCEEDING'
                          ? t.bandExceeding
                          : rep.performanceBand === 'ON_TARGET'
                            ? t.bandOnTarget
                            : t.bandDeveloping}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-outline/10 bg-surface-container-low/50 p-6 text-center">
        <Button variant="outline" asChild className="rounded-xl font-bold">
          <Link href={withLocaleUrl('/admin/advanced-analytics', locale)}>{t.openAnalytics}</Link>
        </Button>
      </div>
    </section>
  )
}
