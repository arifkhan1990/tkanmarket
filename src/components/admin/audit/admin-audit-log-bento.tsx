'use client'

import { BarChart3, Download, Filter, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { AuditLogStats } from '@/types/audit-log-admin.types'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

export function AdminAuditLogBento(props: {
  stats: AuditLogStats | undefined
  statsLoading: boolean
  onExportCsv: () => void
  onOpenFilters: () => void
  exportDisabled: boolean
}) {
  const { stats, statsLoading, onExportCsv, onOpenFilters, exportDisabled } = props
  const { messages } = useI18n()
  const t = messages.admin.auditLogPage

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{t.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">{t.bentoDescription}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" className="rounded-xl" onClick={onExportCsv} disabled={exportDisabled}>
            <Download className="mr-2 h-4 w-4" aria-hidden />
            {t.exportCsv}
          </Button>
          <Button
            type="button"
            className="rounded-xl bg-gradient-to-br from-primary to-primary-container font-bold text-on-primary shadow-lg shadow-primary/20"
            onClick={onOpenFilters}
          >
            <Filter className="mr-2 h-4 w-4" aria-hidden />
            {t.advancedFilters}
          </Button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {statsLoading && !stats ? (
          <>
            {[0, 1, 2].map((i) => (
              <Card key={i} className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6">
                <div className="h-4 w-24 animate-pulse rounded bg-surface-container-high" />
                <div className="mt-3 h-9 w-36 animate-pulse rounded bg-surface-container-high" />
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="relative overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
              <div className="relative z-10">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{t.statToday}</p>
                <p className="font-headline text-4xl font-bold text-on-surface">
                  {stats?.today_actions?.toLocaleString() ?? '—'}
                </p>
                <p className="mt-2 flex items-center gap-1 text-sm text-on-surface-variant">
                  <span
                    className={cn(
                      'flex items-center gap-0.5 font-bold',
                      (stats?.today_delta_pct ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    <TrendingUp className="h-4 w-4" aria-hidden />
                    {stats == null ? '—' : `${stats.today_delta_pct >= 0 ? '+' : ''}${stats.today_delta_pct.toFixed(0)}%`}
                  </span>
                  {t.statVsYesterday}
                </p>
              </div>
              <BarChart3 className="absolute -bottom-2 -right-2 h-24 w-24 text-primary/10" aria-hidden />
            </Card>

            <Card className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.statSecurityTitle}</p>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-3 w-3 rounded-full',
                    stats && stats.failed_actions === 0 ? 'animate-pulse bg-emerald-500' : 'bg-amber-500'
                  )}
                />
                <h3 className="font-headline text-2xl font-bold text-on-surface">
                  {stats?.failed_actions === 0 ? t.statNominal : t.statReview}
                </h3>
              </div>
              <p className="mt-3 text-sm text-on-surface-variant">
                {stats?.failed_actions === 0
                  ? t.statNoFailed
                  : t.statFailedLine.replace('{count}', String(stats?.failed_actions ?? 0))}
              </p>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${stats ? Math.min(100, 100 - Math.min(50, stats.failed_actions * 3)) : 94}%` }}
                />
              </div>
            </Card>

            <Card className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-on-surface-variant">{t.statTopEntity}</span>
                <span className="rounded bg-primary/15 px-2 py-1 text-[10px] font-bold uppercase text-primary">
                  {stats?.top_entity_type ?? '—'}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-outline/10 pt-4">
                <span className="text-sm text-on-surface-variant">{t.stat30DayVolume}</span>
                <span className="font-headline text-lg font-bold text-on-surface">
                  {stats?.total_actions?.toLocaleString() ?? '—'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
                <span>{t.statDistinctIps}</span>
                <span className="font-mono text-primary">{stats?.unique_ips ?? '—'}</span>
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  )
}
