'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'

import { invPageWrap, invPanelFlat, invText } from '@/components/admin/inventory-suite/inventory-suite-styles'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAdminSampleLifecycleQuery } from '@/hooks/admin/useAdminSampleLifecycleQuery'
import { useI18n } from '@/hooks/useI18n'
import type { SampleLifecycleStageUi } from '@/types/admin-sample-lifecycle.types'

function stageBadgeClass(stage: SampleLifecycleStageUi): string {
  switch (stage) {
    case 'REQUESTED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
    case 'IN_TRANSIT':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
    case 'DELIVERED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
    case 'DELAYED':
      return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
    default:
      return 'bg-surface-container-high text-on-surface'
  }
}

export function SampleLifecycleClient() {
  const { messages } = useI18n()
  const t = messages.admin.sampleLifecyclePage
  const [page, setPage] = React.useState(1)
  const [stage, setStage] = React.useState<string>('ALL')
  const limit = 8
  const q = useAdminSampleLifecycleQuery({ page, limit, stage })
  const stats = q.data?.stats
  const items = q.data?.items ?? []
  const meta = q.data?.meta

  const stageLabel = (s: SampleLifecycleStageUi) =>
    s === 'REQUESTED'
      ? t.stageRequested
      : s === 'IN_TRANSIT'
        ? t.stageInTransit
        : s === 'DELIVERED'
          ? t.stageDelivered
          : s === 'DELAYED'
            ? t.stageDelayed
            : t.stageClosed

  return (
    <div className={invPageWrap()}>
      <header className="mb-10">
        <h1 className={cn('text-3xl font-extrabold tracking-tight md:text-4xl', invText.title)}>{t.title}</h1>
        <p className={cn('mt-2 max-w-2xl text-base', invText.body)}>{t.subtitle}</p>
      </header>

      {q.isLoading && !stats ? (
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-container-high" />
          ))}
        </div>
      ) : stats ? (
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className={cn(invPanelFlat(), 'border-l-4 border-l-brand-500 p-6')}>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t.kpiRequested}</p>
            <p className="mt-2 font-heading text-3xl font-bold">{stats.requested}</p>
          </div>
          <div className={cn(invPanelFlat(), 'border-l-4 border-l-violet-500 p-6')}>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t.kpiInTransit}</p>
            <p className="mt-2 font-heading text-3xl font-bold">{stats.inTransit}</p>
          </div>
          <div className={cn(invPanelFlat(), 'border-l-4 border-l-amber-600 p-6')}>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t.kpiDelivered}</p>
            <p className="mt-2 font-heading text-3xl font-bold">{stats.delivered}</p>
          </div>
          <div className={cn(invPanelFlat(), 'border-l-4 border-l-emerald-500 p-6')}>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t.kpiSuccess}</p>
            <p className="mt-2 font-heading text-3xl font-bold">{stats.successRatePercent}%</p>
            {stats.delayed > 0 ? (
              <p className="mt-1 text-xs text-on-surface-variant">
                {t.delayedNote.replace('{n}', String(stats.delayed))}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'REQUESTED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED'] as const).map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={stage === s ? 'default' : 'secondary'}
              className="rounded-full"
              onClick={() => {
                setStage(s)
                setPage(1)
              }}
            >
              {s === 'ALL' ? t.filterAll : stageLabel(s)}
            </Button>
          ))}
        </div>
      </div>

      <div className={cn(invPanelFlat(), 'overflow-hidden')}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant">
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider md:px-6">{t.colSwatch}</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider md:px-6">{t.colBuyer}</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider md:px-6">{t.colStatus}</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider md:px-6">{t.colLogistics}</th>
                <th className="hidden px-4 py-4 text-xs font-bold uppercase tracking-wider md:table-cell md:px-6">
                  {t.colFeedback}
                </th>
                <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider md:px-6">{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {q.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant">
                    {t.loading}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant">
                    {t.empty}
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.leadId} className="border-t border-outline/10">
                    <td className="px-4 py-5 md:px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container-high">
                          {row.imageUrl ? (
                            <Image src={row.imageUrl} alt={row.swatchTitle} fill className="object-cover" sizes="48px" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-on-surface">{row.swatchTitle}</p>
                          <p className="font-mono text-xs text-brand-600">
                            {row.sku ? `${t.skuPrefix}${row.sku}` : t.noSku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 md:px-6">
                      <p className="font-semibold">{row.buyerCompany}</p>
                      <p className="line-clamp-2 text-xs text-on-surface-variant">{row.projectHint}</p>
                    </td>
                    <td className="px-4 py-5 md:px-6">
                      <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-bold', stageBadgeClass(row.stage))}>
                        {stageLabel(row.stage)}
                      </span>
                    </td>
                    <td className="max-w-[200px] px-4 py-5 text-xs text-on-surface-variant md:px-6">
                      {row.logisticsHint ?? '—'}
                    </td>
                    <td className="hidden px-4 py-5 text-xs text-on-surface-variant md:table-cell md:px-6">
                      {row.feedbackHint ?? '—'}
                    </td>
                    <td className="px-4 py-5 text-right md:px-6">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/leads/${row.leadId}`}>{t.openLead}</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-outline/10 px-4 py-4 md:px-6">
            <p className="text-xs text-on-surface-variant">
              {t.showing
                .replace('{from}', String((meta.page - 1) * meta.limit + 1))
                .replace('{to}', String(Math.min(meta.page * meta.limit, meta.total)))
                .replace('{total}', String(meta.total))}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 p-8 text-white">
          <h3 className="text-2xl font-bold">{t.promoTitle}</h3>
          <p className="mt-2 max-w-lg text-sm text-brand-100">{t.promoBody}</p>
          <Button className="mt-6 bg-surface-container-lowest text-brand-700 hover:bg-brand-50" asChild>
            <Link href="/admin/global-shipping-logistics">{t.promoCta}</Link>
          </Button>
        </div>
        <div className={cn(invPanelFlat(), 'p-6')}>
          <h3 className={cn('mb-4 text-lg font-bold', invText.title)}>{t.heatmapTitle}</h3>
          <div className="space-y-4">
            {(() => {
              const s = stats ?? {
                requested: 0,
                inTransit: 0,
                delivered: 0,
                delayed: 0,
                successRatePercent: 0
              }
              const max = Math.max(1, s.requested + s.inTransit + s.delivered + s.delayed)
              const rows = [
                { label: t.heatmap1, count: s.requested, pct: Math.round((s.requested / max) * 100) },
                { label: t.heatmap2, count: s.inTransit, pct: Math.round((s.inTransit / max) * 100) },
                { label: t.heatmap3, count: s.delivered, pct: Math.round((s.delivered / max) * 100) }
              ]
              return rows.map((h) => (
                <div key={h.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{h.label}</span>
                    <span className="font-mono text-xs font-bold text-brand-600">{h.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                    <div className="h-full bg-brand-500" style={{ width: `${h.pct}%` }} />
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
