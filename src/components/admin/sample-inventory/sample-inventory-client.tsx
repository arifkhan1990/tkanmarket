'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Package } from 'lucide-react'

import { invPageWrap, invPanelFlat, invText } from '@/components/admin/inventory-suite/inventory-suite-styles'
import { InventoryFabricsTableSection } from '@/components/admin/inventory-suite/inventory-fabrics-table-section'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAdminInventoryInsightsQuery } from '@/hooks/admin/useAdminInventoryInsightsQuery'
import { useAdminLogisticsShipmentsQuery } from '@/hooks/admin/useAdminLogisticsShipmentsQuery'
import { useI18n } from '@/hooks/useI18n'

export function SampleInventoryClient() {
  const { messages } = useI18n()
  const t = messages.admin.sampleInventoryPage
  const inv = useAdminInventoryInsightsQuery()
  const ship = useAdminLogisticsShipmentsQuery({ page: 1, limit: 6, status: 'ALL' })
  const d = inv.data
  const overview = ship.data?.overview

  return (
    <div className={invPageWrap()}>
      <header className="mb-10">
        <h1 className={cn('text-3xl font-extrabold tracking-tight md:text-4xl', invText.title)}>{t.title}</h1>
        <p className={cn('mt-2 max-w-2xl text-base', invText.body)}>{t.subtitle}</p>
      </header>

      {inv.isLoading ? (
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-surface-container-high" />
          ))}
        </div>
      ) : d ? (
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className={cn(invPanelFlat(), 'border-l-4 border-l-brand-500 p-6')}>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t.statSwatches}
            </p>
            <p className="mt-2 font-heading text-3xl font-extrabold text-on-surface">
              {d.summary.totalSkuCount.toLocaleString()}
            </p>
            <p className="mt-2 text-xs font-semibold text-brand-600 dark:text-brand-400">{t.statSwatchesHint}</p>
          </div>
          <div className={cn(invPanelFlat(), 'border-l-4 border-l-red-500 p-6')}>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t.statLowStock}
            </p>
            <p className="mt-2 font-heading text-3xl font-extrabold text-red-600 dark:text-red-400">
              {d.lowStockAlerts.length}
            </p>
            <p className="mt-2 text-xs text-on-surface-variant">{t.statLowStockHint}</p>
          </div>
          <div className={cn(invPanelFlat(), 'border-l-4 border-l-amber-600 p-6')}>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t.statShipments}
            </p>
            <p className="mt-2 font-heading text-3xl font-extrabold text-on-surface">
              {overview?.totalShipments ?? '—'}
            </p>
            <p className="mt-2 text-xs text-on-surface-variant">{t.statShipmentsHint}</p>
          </div>
          <div className={cn(invPanelFlat(), 'border-l-4 border-l-violet-500 p-6')}>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t.statCapacity}
            </p>
            <p className="mt-2 font-heading text-3xl font-extrabold text-on-surface">
              {d.summary.readinessScore}%
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full bg-violet-500 transition-all"
                style={{ width: `${Math.min(100, d.summary.readinessScore)}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <InventoryFabricsTableSection variant="health" />
        </div>
        <div className="space-y-8 lg:col-span-4">
          <div className={cn(invPanelFlat(), 'p-6')}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className={cn('text-lg font-bold', invText.title)}>{t.pendingTitle}</h3>
              {overview ? (
                <span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-800 dark:bg-brand-950/50 dark:text-brand-300">
                  {overview.totalShipments} {t.pendingTotal}
                </span>
              ) : null}
            </div>
            <div className="space-y-4">
              {ship.isLoading ? (
                <div className="h-24 animate-pulse rounded-xl bg-surface-container-high" />
              ) : (
                (ship.data?.items ?? []).slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    className="cursor-pointer rounded-xl border border-outline/10 bg-surface-container-low/90 p-4 transition-all hover:translate-x-0.5"
                  >
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-mono font-bold text-brand-600">{s.trackingCode}</span>
                      <span className="text-on-surface-variant">{s.status}</span>
                    </div>
                    <div className="text-sm font-bold">{s.supplierName}</div>
                    <div className="mt-1 text-xs text-on-surface-variant">
                      {s.originCity}, {s.originCountry}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button variant="ghost" size="sm" className="h-8 gap-1 px-0 text-xs font-bold text-brand-600" asChild>
                        <Link href="/admin/global-shipping-logistics">
                          {t.shipNow}
                          <ChevronRight className="h-4 w-4" aria-hidden />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button variant="outline" className="mt-6 w-full border-dashed" asChild>
              <Link href="/admin/global-shipping-logistics">{t.viewShipments}</Link>
            </Button>
          </div>

          <div className={cn(invPanelFlat(), 'p-6')}>
            <h3 className={cn('mb-4 text-lg font-bold', invText.title)}>{t.distributionTitle}</h3>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-container-high">
              {d?.hub?.mapImageUrl ? (
                <>
                  <Image
                    src={d.hub.mapImageUrl}
                    alt=""
                    fill
                    className="object-cover opacity-90 dark:opacity-80"
                    sizes="(max-width: 1024px) 100vw, 400px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-outline">
                  <Package className="h-12 w-12" aria-hidden />
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-on-surface">{t.hubLabel}</div>
                  <div className="text-[10px] text-on-surface-variant">{t.hubSub}</div>
                </div>
                <div className="text-right font-mono text-sm font-bold text-brand-600">
                  {d?.summary.globalHealthIndex ?? 0}% {t.loadLabel}
                </div>
              </div>
            </div>
            <ul className="mt-6 space-y-3 text-xs">
              {(d?.regionalRows ?? []).slice(0, 3).map((r) => (
                <li key={r.regionKey} className="flex justify-between">
                  <span className="text-on-surface-variant">{r.label}</span>
                  <span className="font-mono font-bold">{r.catalogUnits.toLocaleString()} u</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
