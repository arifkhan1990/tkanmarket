'use client'

import Image from 'next/image'
import { Globe2, MapPin, Truck } from 'lucide-react'

import {
  invPageWrap,
  invPanel,
  invPanelMuted,
  invText
} from '@/components/admin/inventory-suite/inventory-suite-styles'
import { useAdminInventoryInsightsQuery } from '@/hooks/admin/useAdminInventoryInsightsQuery'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

export function AdminInventoryDistributionHubClient() {
  const { messages } = useI18n()
  const t = messages.admin.inventorySuite
  const q = useAdminInventoryInsightsQuery()
  const d = q.data

  return (
    <div className={invPageWrap()}>
      <header className="mb-8">
        <h1 className={cn('text-2xl font-bold tracking-tight md:text-3xl', invText.title)}>{t.hubTitle}</h1>
        <p className={cn('mt-1 max-w-3xl text-sm md:text-base', invText.body)}>{t.hubSubtitle}</p>
      </header>

      {q.isLoading ? (
        <div className="grid animate-pulse gap-6 lg:grid-cols-12">
          <div className="h-[420px] rounded-2xl bg-surface-container-high lg:col-span-8" />
          <div className="h-[420px] rounded-2xl bg-surface-container-high lg:col-span-4" />
        </div>
      ) : d ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className={cn('relative overflow-hidden p-4 lg:col-span-8', invPanel())}>
            <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
              <span className="flex items-center gap-2 rounded-xl bg-surface-container-lowest/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-on-surface shadow-sm backdrop-blur">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" aria-hidden />
                {t.activeLanes}: <span className="font-mono text-brand-600 dark:text-brand-400">{d.hub.activeLanes}</span>
              </span>
              <span className="flex items-center gap-2 rounded-xl bg-surface-container-lowest/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-on-surface shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-amber-600" aria-hidden />
                {t.delayed}: <span className="font-mono text-amber-800 dark:text-amber-300">{d.hub.delayedLanes}</span>
              </span>
            </div>
            <div className="relative mt-14 h-[min(56vh,420px)] w-full overflow-hidden rounded-xl border border-outline/10 bg-surface-container-low">
              <Image
                src={d.hub.mapImageUrl}
                alt=""
                fill
                className="object-cover opacity-90 mix-blend-multiply"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
              {d.hub.markers.map((m) => (
                <div
                  key={`${m.label}-${m.leftPercent}`}
                  className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ top: `${m.topPercent}%`, left: `${m.leftPercent}%` }}
                >
                  <span
                    className={cn(
                      'block h-3 w-3 rounded-full shadow-lg',
                      m.status === 'warn' ? 'bg-amber-600' : 'bg-brand-600'
                    )}
                  />
                  <div className="pointer-events-none absolute left-1/2 top-5 hidden w-36 -translate-x-1/2 rounded-lg border border-outline/15 bg-surface-container-lowest p-2 text-xs shadow-xl group-hover:block">
                    <p className="text-[10px] font-bold uppercase text-outline">{m.label}</p>
                    <p className={cn('font-semibold', invText.title)}>{m.capacityPercent}%</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-6 lg:col-span-4">
            <div className={invPanel('p-6')}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={cn('font-semibold', invText.title)}>{t.regionalDistribution}</h3>
                <span className="text-xs font-semibold text-brand-600">{t.fullReport}</span>
              </div>
              <ul className="space-y-5">
                {d.regionalRows.length === 0 ? (
                  <li className={cn('text-sm', invText.muted)}>{t.noMarkers}</li>
                ) : (
                  d.regionalRows.map((r) => (
                    <li key={r.regionKey} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                            r.statusNote === 'LOW' || r.statusNote === 'MAINTENANCE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-brand-100 text-brand-700'
                          )}
                        >
                          {r.regionKey === 'EU' ? <MapPin className="h-5 w-5" /> : <Globe2 className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className={cn('truncate text-sm font-semibold', invText.title)}>{r.label}</p>
                          <p className="font-mono text-[10px] text-outline">ID: {r.regionCode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn('text-sm font-semibold', invText.title)}>
                          {r.catalogUnits.toLocaleString()}{' '}
                          <span className="text-xs font-normal text-outline">{t.catalogUnits}</span>
                        </p>
                        <div className="mt-1 h-1.5 w-24 rounded-full bg-surface-container-high">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${r.fillPercent}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
              <div className={invPanelMuted('mt-6 p-4')}>
                <p className={cn('text-[10px] font-bold uppercase', invText.muted)}>{t.globalHealthIndex}</p>
                <div className="mt-1 flex items-end gap-2">
                  <span className={cn('text-3xl font-extrabold', invText.title)}>{d.summary.globalHealthIndex}</span>
                  <span className="mb-1 text-sm font-semibold text-brand-600 dark:text-brand-400">
                    +{d.summary.readinessDeltaPercent}%
                  </span>
                </div>
              </div>
            </div>

            <div className={invPanelMuted('p-6')}>
              <h3 className={cn('mb-4 flex items-center gap-2 font-semibold', invText.title)}>
                <Truck className="h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden />
                {t.activeTransits}
              </h3>
              {d.transits.length === 0 ? (
                <p className={cn('text-sm', invText.muted)}>{t.noShipments}</p>
              ) : (
                <ul className="space-y-3">
                  {d.transits.map((tr) => (
                    <li
                      key={tr.trackingCode}
                      className="rounded-xl border border-outline/10 bg-surface-container-lowest p-3 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="font-mono text-[10px] text-on-surface-variant">{tr.trackingCode}</span>
                        <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">{tr.status}</span>
                      </div>
                      <p className={cn('mt-1 text-xs font-semibold', invText.title)}>{tr.productNote}</p>
                      <p className={cn('mt-0.5 text-[10px]', invText.muted)}>{tr.routeNote}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="col-span-12 grid grid-cols-1 gap-4 md:grid-cols-4">
            <MetricCard label={t.totalSkuCount} value={d.summary.totalSkuCount.toLocaleString()} hint={t.masterInventoryHint} />
            <MetricCard
              label={t.stockTurnover}
              value={`${d.summary.stockTurnoverProxy}x`}
              hint={`+${d.summary.readinessDeltaPercent}%`}
              hintClassName="text-brand-600"
            />
            <MetricCard
              label={t.avgFulfillment}
              value={`${d.summary.avgFulfillmentDaysProxy}d`}
              hint={t.networkUtilizationHint}
            />
            <MetricCard label={t.returnRate} value={`${d.summary.returnRatePercent}%`} hint={t.serviceLevel} />
          </div>

          <section className="col-span-12 rounded-2xl border border-outline/15 bg-surface-container-low p-6 md:p-8">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h3 className={cn('text-lg font-semibold', invText.title)}>{t.networkUtilization}</h3>
                <p className={cn('text-sm', invText.muted)}>{t.networkUtilizationHint}</p>
              </div>
            </div>
            {d.hub.utilizationSeries.length === 0 ? (
              <p className={cn('text-sm', invText.muted)}>{t.noMonthly}</p>
            ) : (
              <div className="flex h-40 items-end gap-2 px-2">
                {d.hub.utilizationSeries.map((bar) => (
                  <div key={bar.label} className="group relative flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-md bg-brand-500/80 transition-colors group-hover:bg-brand-600"
                      style={{ height: `${Math.max(12, bar.percent)}%` }}
                    />
                    <span className="text-[9px] font-bold uppercase text-outline">{bar.label}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <p className={cn('text-sm', invText.body)}>{t.retry}</p>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  hintClassName
}: {
  label: string
  value: string
  hint: string
  hintClassName?: string
}) {
  return (
    <div className={invPanel('p-5')}>
      <p className={cn('text-[10px] font-bold uppercase tracking-wider', invText.muted)}>{label}</p>
      <p className={cn('mt-1 font-mono text-2xl font-black', invText.title)}>{value}</p>
      <p className={cn('mt-2 text-xs', invText.muted, hintClassName)}>{hint}</p>
    </div>
  )
}
