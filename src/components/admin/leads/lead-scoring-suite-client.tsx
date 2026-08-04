'use client'

import * as React from 'react'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton/StatCardSkeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLeadScoringDashboard } from '@/hooks/admin/useLeadScoringDashboard'
import { useI18n } from '@/hooks/useI18n'
import type { LeadScoringListItem } from '@/types/lead-scoring-dashboard.types'

type Tab = 'overview' | 'qualification'

function qualBadgeClass(label: LeadScoringListItem['qualificationLabel']) {
  if (label === 'qualified') return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
  if (label === 'assessing') return 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100'
  if (label === 'flagged') return 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200'
  return 'bg-surface-container-high text-on-surface-variant'
}

function qualLabel(
  label: LeadScoringListItem['qualificationLabel'],
  m: ReturnType<typeof useI18n>['messages']['admin']['leadScoringPage']
) {
  if (label === 'qualified') return m.qual
  if (label === 'assessing') return m.assess
  if (label === 'flagged') return m.flag
  return m.neu
}

export function LeadScoringSuiteClient({ initialTab }: { initialTab: Tab }) {
  const { messages } = useI18n()
  const m = messages.admin.leadScoringPage
  const [tab, setTab] = React.useState<Tab>(initialTab)
  const [selectedId, setSelectedId] = React.useState<number | undefined>(undefined)
  const [qHigh, setQHigh] = React.useState(false)
  const [qPending, setQPending] = React.useState(false)

  const query = useLeadScoringDashboard(selectedId)
  const d = query.data

  const filtered = React.useMemo(() => {
    const items = d?.items ?? []
    if (tab !== 'qualification') return items
    return items.filter((it) => {
      if (qHigh && it.score < 80) return false
      if (qPending && it.qualificationLabel !== 'assessing' && it.qualificationLabel !== 'new') return false
      return true
    })
  }, [d?.items, qHigh, qPending, tab])

  const breakdown = d?.selectedBreakdown

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{m.title}</h1>
        <p className="mt-2 max-w-2xl text-lg text-on-surface-variant">{m.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl bg-surface-container-low p-1">
        <Button
          type="button"
          variant={tab === 'overview' ? 'default' : 'ghost'}
          className="rounded-lg"
          onClick={() => setTab('overview')}
        >
          {m.tabOverview}
        </Button>
        <Button
          type="button"
          variant={tab === 'qualification' ? 'default' : 'ghost'}
          className="rounded-lg"
          onClick={() => setTab('qualification')}
        >
          {m.tabQualification}
        </Button>
      </div>

      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {(
            [
              { label: m.metricsTotal, v: d?.metrics.totalLeads30d ?? 0, tone: 'blue' as const },
              { label: m.metricsAvgScore, v: d?.metrics.avgScore ?? 0, tone: 'green' as const },
              { label: m.metricsQualified, v: `${d?.metrics.qualifiedRatePercent ?? 0}%`, tone: 'yellow' as const },
              { label: m.metricsWinRate, v: `${d?.metrics.winRatePercent ?? 0}%`, tone: 'red' as const }
            ] as const
          ).map((x) => (
            <DashboardStatCardShell key={x.label} tone={x.tone}>
              <p className={dashboardStatLabelClass}>{x.label}</p>
              <p className={cn(dashboardStatValueClass, 'font-heading font-extrabold')}>{x.v}</p>
            </DashboardStatCardShell>
          ))}
        </div>
      )}

      {tab === 'qualification' ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={!qHigh && !qPending ? 'default' : 'outline'} onClick={() => { setQHigh(false); setQPending(false) }}>
            {m.qualificationFilterAll}
          </Button>
          <Button type="button" size="sm" variant={qHigh ? 'default' : 'outline'} onClick={() => { setQHigh(true); setQPending(false) }}>
            {m.qualificationFilterHigh}
          </Button>
          <Button type="button" size="sm" variant={qPending ? 'default' : 'outline'} onClick={() => { setQPending(true); setQHigh(false) }}>
            {m.qualificationFilterPending}
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <section className="space-y-4 xl:col-span-8">
          <h2 className="font-heading text-xl font-bold text-on-surface">{m.listTitle}</h2>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline/30 p-10 text-center text-sm text-on-surface-variant">{m.empty}</div>
          ) : (
            filtered.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => setSelectedId(it.id)}
                className={cn(
                  'flex w-full flex-col gap-3 rounded-2xl border p-5 text-left transition-all md:flex-row md:items-center md:justify-between',
                  selectedId === it.id || (!selectedId && breakdown?.leadId === it.id)
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-outline/10 bg-surface-container-lowest hover:border-primary/30'
                )}
              >
                <div>
                  <div className="font-heading text-lg font-bold text-on-surface">{it.companyName}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                    <span className="font-mono">#{it.id}</span>
                    <span>{it.country}</span>
                    <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-[10px]">{it.source}</span>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-outline">Score</div>
                    <div className="font-heading text-2xl font-extrabold text-primary">{it.score}</div>
                  </div>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-bold', qualBadgeClass(it.qualificationLabel))}>
                    {qualLabel(it.qualificationLabel, m)}
                  </span>
                  <Link href={`/admin/leads/${it.id}`} className="text-sm font-bold text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                    →
                  </Link>
                </div>
              </button>
            ))
          )}
        </section>

        <aside className="space-y-6 xl:col-span-4">
          <div className="rounded-3xl border border-outline/10 bg-surface-container-lowest p-6 shadow-lg">
            <h2 className="font-heading text-xl font-extrabold text-on-surface">{m.breakdownTitle}</h2>
            {breakdown ? (
              <div className="mt-6 space-y-5">
                {[
                  { k: 'Budget alignment', v: breakdown.budgetAlignment, w: breakdown.budgetAlignment * 10 },
                  { k: 'Volume requirement', v: breakdown.volumeRequirement, w: breakdown.volumeRequirement * 10 },
                  { k: 'Urgency / timeline', v: breakdown.urgencyTimeline, w: breakdown.urgencyTimeline * 10 }
                ].map((row) => (
                  <div key={row.k} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">{row.k}</span>
                      <span className="font-mono font-bold text-primary">{row.v.toFixed(1)}/10</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${row.w}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-sm leading-relaxed text-on-surface-variant">{breakdown.insight}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-on-surface-variant">{m.empty}</p>
            )}
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-primary to-primary-container p-6 text-on-primary shadow-xl">
            <h3 className="font-heading text-lg font-bold">{m.marketCardTitle}</h3>
            <p className="mt-2 text-sm text-indigo-100">{m.marketCardBody}</p>
            <TrendingUp className="mt-4 h-8 w-8 opacity-80" aria-hidden />
          </div>
        </aside>
      </div>

      <section className="rounded-[2rem] bg-surface-container-low p-6 md:p-10">
        <div className="mb-6">
          <h2 className="font-heading text-2xl font-extrabold text-on-surface">{m.velocityTitle}</h2>
          <p className="text-sm text-on-surface-variant">{m.velocitySubtitle}</p>
        </div>
        <div className="flex h-40 items-end gap-1 overflow-x-auto pb-2">
          {(d?.velocity ?? []).map((b) => (
            <div key={b.day} className="flex min-w-[20px] flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-sm bg-primary/80 transition-all hover:bg-primary"
                style={{ height: `${8 + Math.min(b.count * 14, 120)}px` }}
                title={`${b.day}: ${b.count}`}
              />
              <span className="rotate-45 text-[9px] font-mono text-outline md:rotate-0">{b.day.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
