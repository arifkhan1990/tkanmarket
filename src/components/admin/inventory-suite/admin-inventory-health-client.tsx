'use client'

import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'

import { invPageWrap, invPanelFlat, invText } from '@/components/admin/inventory-suite/inventory-suite-styles'
import { useAdminInventoryInsightsQuery } from '@/hooks/admin/useAdminInventoryInsightsQuery'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

import { InventoryFabricsTableSection } from './inventory-fabrics-table-section'

export function AdminInventoryHealthClient() {
  const { messages } = useI18n()
  const t = messages.admin.inventorySuite
  const q = useAdminInventoryInsightsQuery()
  const d = q.data

  return (
    <div className={invPageWrap()}>
      <header className="mb-10">
        <h1 className={cn('text-3xl font-extrabold tracking-tight', invText.title)}>{t.healthTitle}</h1>
        <p className={cn('mt-2 max-w-2xl', invText.body)}>{t.healthSubtitle}</p>
      </header>

      {q.isLoading ? (
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-surface-container-high" />
          ))}
        </div>
      ) : d ? (
        <>
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
            <div
              className={cn(
                invPanelFlat(),
                'md:col-span-2 flex flex-col justify-between p-8 lg:min-h-[220px]'
              )}
            >
              <div>
                <h3 className={cn('text-xs font-bold uppercase tracking-widest', invText.muted)}>
                  {t.replenishmentReadiness}
                </h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-brand-600 dark:text-brand-400">{d.summary.readinessScore}</span>
                  <span className="text-2xl font-bold text-outline">/100</span>
                </div>
                <p className={cn('mt-2 text-sm', invText.body)}>{d.summary.replenishmentNote}</p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" aria-hidden />+{d.summary.readinessDeltaPercent}%
                </span>
                <span className="text-outline">vs last week</span>
              </div>
            </div>

            <div className={cn(invPanelFlat(), 'p-6')}>
              <h3 className={cn('text-xs font-bold uppercase tracking-widest', invText.muted)}>{t.agingInventory}</h3>
              <div className="mt-6 space-y-4">
                <AgingRow label="90+ days" pct={d.summary.agingBuckets.days90Plus} barClass="bg-red-500" />
                <AgingRow label="60–90 days" pct={d.summary.agingBuckets.days60to90} barClass="bg-amber-600" />
                <AgingRow label="0–60 days" pct={d.summary.agingBuckets.days0to60} barClass="bg-brand-600" />
              </div>
            </div>

            <div className={cn(invPanelFlat(), 'flex flex-col p-6')}>
              <h3 className={cn('text-xs font-bold uppercase tracking-widest', invText.muted)}>{t.stockValuation}</h3>
              <p className={cn('mt-4 text-3xl font-extrabold', invText.title)}>
                ${(d.summary.stockValuationUsd / 1_000_000).toFixed(2)}M
              </p>
              <p className={cn('mt-2 text-xs', invText.muted)}>
                {t.activeCenters}: {d.summary.activeSuppliers}
              </p>
              <div className="mt-6 border-t border-outline/10 pt-4">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-outline">{t.avgUnitCost}</span>
                  <span className={invText.title}>${d.summary.avgUnitCostUsd.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className={cn(invPanelFlat(), 'lg:col-span-2 p-8')}>
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <h3 className={cn('text-xl font-bold', invText.title)}>{t.distributionByMaterial}</h3>
                <div className="flex gap-2">
                  <span className="rounded-lg bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-600 dark:text-brand-400">
                    {t.monthly}
                  </span>
                  <span className="rounded-lg px-3 py-1 text-xs font-bold text-outline">
                    {t.quarterly}
                  </span>
                </div>
              </div>
              <div className="flex h-64 items-end justify-between gap-2 px-2">
                {d.materialDistributionChart.map((m) => (
                  <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-lg bg-brand-200 transition-colors hover:bg-brand-500 dark:bg-brand-900/80 dark:hover:bg-brand-500"
                      style={{ height: `${m.barPercent}%` }}
                    />
                    <span className="text-[10px] font-mono font-bold uppercase text-outline">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn(invPanelFlat(), 'p-8')}>
              <div className="mb-6 flex items-center justify-between">
                <h3 className={cn('text-xl font-bold', invText.title)}>{t.lowStockAlerts}</h3>
                <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase text-red-800 dark:bg-red-950/50 dark:text-red-300">
                  {d.lowStockAlerts.length} {t.issues}
                </span>
              </div>
              <ul className="space-y-3">
                {d.lowStockAlerts.length === 0 ? (
                  <li className={cn('flex items-center gap-2 text-sm', invText.muted)}>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
                    {t.noLowStockAlerts}
                  </li>
                ) : (
                  d.lowStockAlerts.map((a) => (
                    <li key={a.fabricId} className="flex gap-3 rounded-xl bg-surface-container-low p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                        <AlertTriangle className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className={cn('font-semibold text-sm', invText.title)}>{a.title}</p>
                        <p className={cn('font-mono text-xs', invText.muted)}>{a.sku ?? 'SKU —'}</p>
                        <p className={cn('mt-1 text-[10px]', invText.body)}>{a.remainingNote}</p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <InventoryFabricsTableSection variant="health" />
        </>
      ) : (
        <p className={cn('text-sm', invText.body)}>{t.retry}</p>
      )}
    </div>
  )
}

function AgingRow({ label, pct, barClass }: { label: string; pct: number; barClass: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className={cn('font-semibold', invText.title)}>{label}</span>
        <span className={cn('font-mono', invText.muted)}>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
        <div className={cn('h-full rounded-full', barClass)} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  )
}
