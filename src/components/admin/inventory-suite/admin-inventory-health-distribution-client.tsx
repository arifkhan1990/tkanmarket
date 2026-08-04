'use client'

import type { ComponentType } from 'react'
import { Factory, Hourglass, Wallet, AlertTriangle } from 'lucide-react'

import { invPageWrap, invPanelFlat, invText } from '@/components/admin/inventory-suite/inventory-suite-styles'
import { useAdminInventoryInsightsQuery } from '@/hooks/admin/useAdminInventoryInsightsQuery'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

import { InventoryFabricsTableSection } from './inventory-fabrics-table-section'

export function AdminInventoryHealthDistributionClient() {
  const { messages } = useI18n()
  const t = messages.admin.inventorySuite
  const q = useAdminInventoryInsightsQuery()
  const d = q.data

  const score = d?.summary.inventoryHealthScore ?? 0
  const circumference = 2 * Math.PI * 88
  const offset = circumference * (1 - score / 100)

  return (
    <div className={invPageWrap()}>
      <header className="mb-8">
        <h2 className={cn('text-2xl font-extrabold tracking-tight md:text-3xl', invText.title)}>
          {t.healthDistTitle}{' '}
          <span className="text-lg font-medium text-brand-600/80 dark:text-brand-400/90">{t.healthDistBadge}</span>
        </h2>
        <p className={cn('mt-1', invText.body)}>{t.healthDistSubtitle}</p>
      </header>

      {q.isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-surface-container-high" />
      ) : d ? (
        <>
          <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Wallet}
              tag={`+${d.summary.readinessDeltaPercent}%`}
              tagClass="bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
              label={t.totalStockValue}
              value={`$${(d.summary.totalStockValueUsd / 1_000_000).toFixed(2)}M`}
            />
            <StatCard
              icon={AlertTriangle}
              tag="Alert"
              tagClass="bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
              label={t.lowStockSkus}
              value={`${d.summary.lowStockSkuCount}`}
            />
            <StatCard
              icon={Hourglass}
              tag="90+ days"
              tagClass="bg-surface-container-high text-on-surface"
              label={t.agingCap}
              value={`${d.summary.agingInventoryPercent}%`}
            />
            <StatCard
              icon={Factory}
              tag="Global"
              tagClass="bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
              label={t.activeSuppliers}
              value={`${d.summary.activeSuppliers}`}
            />
          </section>

          <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className={cn(invPanelFlat(), 'lg:col-span-2 p-8')}>
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <h3 className={cn('text-lg font-bold', invText.title)}>{t.stockByMaterial}</h3>
                  <p className={cn('text-sm', invText.muted)}>{t.globalTonnage}</p>
                </div>
              </div>
              <div className="space-y-5">
                {d.materialDistribution.map((m) => (
                  <div key={m.label} className="space-y-2">
                    <div
                      className={cn(
                        'flex justify-between text-xs font-semibold uppercase tracking-wide',
                        invText.body
                      )}
                    >
                      <span>{m.label}</span>
                      <span className="font-mono">{m.unitsProxy.toLocaleString()} units</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className="h-full rounded-full bg-brand-500 dark:bg-brand-400"
                        style={{ width: `${m.barPercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn(invPanelFlat(), 'flex flex-col items-center p-8 text-center')}>
              <h3 className={cn('text-lg font-bold', invText.title)}>{t.healthScore}</h3>
              <p className={cn('text-sm', invText.muted)}>{t.aggregateEfficiency}</p>
              <div className="relative mt-6 flex h-48 w-48 items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 192 192" aria-hidden>
                  <circle
                    className="text-surface-container-high"
                    cx="96"
                    cy="96"
                    r="88"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                  />
                  <circle
                    className="text-brand-600 transition-all dark:text-brand-400"
                    cx="96"
                    cy="96"
                    r="88"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                  />
                </svg>
                <div className="relative z-10">
                  <p className={cn('text-5xl font-black', invText.title)}>{score}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                    {t.excellent}
                  </p>
                </div>
              </div>
              <div className="mt-8 grid w-full grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface-container-low p-3">
                  <p className={cn('text-[10px] font-bold uppercase', invText.muted)}>{t.turnoverRate}</p>
                  <p className="font-mono text-lg font-bold text-brand-600 dark:text-brand-400">{d.summary.turnoverRate}x</p>
                </div>
                <div className="rounded-lg bg-surface-container-low p-3">
                  <p className={cn('text-[10px] font-bold uppercase', invText.muted)}>{t.serviceLevel}</p>
                  <p className="font-mono text-lg font-bold text-brand-600 dark:text-brand-400">
                    {d.summary.serviceLevelPercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </section>

          <InventoryFabricsTableSection variant="distribution" />
        </>
      ) : (
        <p className={cn('text-sm', invText.body)}>{t.retry}</p>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  tag,
  tagClass,
  label,
  value
}: {
  icon: ComponentType<{ className?: string }>
  tag: string
  tagClass: string
  label: string
  value: string
}) {
  return (
    <div
      className={cn(
        invPanelFlat(),
        'p-6 transition-transform hover:-translate-y-0.5 hover:border-outline/20'
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <Icon
          className="h-9 w-9 rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
          aria-hidden
        />
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', tagClass)}>{tag}</span>
      </div>
      <p className={cn('text-xs font-semibold uppercase tracking-wider', invText.muted)}>{label}</p>
      <p className={cn('mt-1 font-mono text-2xl font-bold', invText.title)}>{value}</p>
    </div>
  )
}
