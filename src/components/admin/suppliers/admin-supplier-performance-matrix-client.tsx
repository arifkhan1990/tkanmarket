'use client'

import Image from 'next/image'
import { Factory } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAdminSupplierPerformanceMatrixQuery } from '@/hooks/admin/useAdminSupplierSuiteQueries'
import { useI18n } from '@/hooks/useI18n'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import { SupplierSuiteSubNav } from '@/components/admin/suppliers/supplier-suite-subnav'

function MatrixSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-surface-container-high" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="h-64 rounded-2xl bg-surface-container-high lg:col-span-4" />
        <div className="h-64 rounded-2xl bg-surface-container-high lg:col-span-8" />
      </div>
      <div className="h-48 rounded-2xl bg-surface-container-high" />
    </div>
  )
}

export function AdminSupplierPerformanceMatrixClient() {
  const { messages } = useI18n()
  const m = messages.admin.supplierSuite
  const q = useAdminSupplierPerformanceMatrixQuery()

  if (q.isLoading || !q.data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-surface-container-high sm:w-72" />
        <SupplierSuiteSubNav className="mb-0" />
        <MatrixSkeleton />
      </div>
    )
  }

  const d = q.data
  const snap = d.snapshot
  const radar = d.radarAxes
  const polar = (vals: number[]) =>
    vals
      .map((v, i) => {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5
        const r = (v / 100) * 38
        return `${50 + r * Math.cos(ang)},${50 + r * Math.sin(ang)}`
      })
      .join(' ')
  const polyA = polar(radar.map((x) => x.a))
  const polyB = polar(radar.map((x) => x.b))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{m.performanceTitle}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">{m.performanceSubtitle}</p>
      </div>

      <SupplierSuiteSubNav className="mb-0" />

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-sm dark:border-outline/15 lg:col-span-4">
          <h2 className="font-heading text-lg font-bold text-on-surface">{m.snapshotTitle}</h2>
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                  {m.metricQuality}
                </p>
                <p className="font-heading text-3xl font-bold">{snap.globalQualityRatePercent.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                  {m.metricLeadTime}
                </p>
                <p className="font-heading text-3xl font-bold">
                  {snap.avgInquiryToCloseDays != null ? `${snap.avgInquiryToCloseDays} ${m.days}` : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                  {m.metricResponse}
                </p>
                <p className="font-heading text-3xl font-bold">{snap.responseIndex.toFixed(1)}/5</p>
              </div>
            </div>
          </div>
          {snap.topPerformer ? (
            <div className="mt-8 border-t border-outline/10 pt-6">
              <h3 className="text-sm font-bold text-on-surface">{m.topPerformer}</h3>
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Factory className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{snap.topPerformer.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {m.composite}: {snap.topPerformer.compositeScore.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-sm dark:border-outline/15 lg:col-span-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-bold">{m.radarTitle}</h2>
            <div className="flex flex-wrap gap-2">
              {d.radarSuppliers.map((s, i) => (
                <span
                  key={`${s.name}-${i}`}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                    s.color === 'primary'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-tertiary/10 text-tertiary'
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', s.color === 'primary' ? 'bg-primary' : 'bg-tertiary')} />
                  {s.name}
                </span>
              ))}
            </div>
          </div>
          <svg viewBox="0 0 100 100" className="mx-auto h-64 w-full max-w-md" role="img" aria-label={m.radarTitle}>
            <polygon
              points={polyA}
              fill="rgba(26, 64, 194, 0.2)"
              stroke="var(--primary)"
              strokeWidth="0.8"
            />
            <polygon
              points={polyB}
              fill="rgba(134, 55, 0, 0.15)"
              stroke="var(--tertiary)"
              strokeWidth="0.6"
              strokeDasharray="2 2"
            />
            {[80, 60, 40, 20].map((r) => (
              <circle key={r} cx="50" cy="50" r={r / 2} fill="none" stroke="#ebeef3" strokeWidth="0.2" />
            ))}
          </svg>
          <p className="mt-4 text-center text-[10px] font-mono text-on-surface-variant">
            {m.generated}: {new Date(d.generatedAt).toLocaleString()}
          </p>
        </section>
      </div>

      <section className="overflow-x-auto rounded-2xl border border-outline/10 bg-surface-container-lowest/80 shadow-sm dark:border-outline/15">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-outline/10 bg-surface-container-low/80 text-xs uppercase tracking-widest text-on-surface-variant">
              <th className="px-4 py-3">{m.colSupplier}</th>
              <th className="px-4 py-3">{m.colQuality}</th>
              <th className="px-4 py-3">{m.colConversion}</th>
              <th className="px-4 py-3">{m.colFabrics}</th>
              <th className="px-4 py-3">{m.colScore}</th>
            </tr>
          </thead>
          <tbody>
            {d.rows.map((row) => (
              <tr key={row.supplierId} className="border-b border-outline/5 hover:bg-surface-container-low/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
                      {row.logoUrl ? (
                        <Image
                          src={row.logoUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="36px"
                          unoptimized={isRemoteImageSrc(row.logoUrl)}
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[10px] font-bold">
                          {row.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{row.name}</div>
                      <div className="truncate text-xs text-on-surface-variant">
                        {row.country}
                        {row.city ? ` · ${row.city}` : ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono">{row.qualityRatePercent.toFixed(1)}%</td>
                <td className="px-4 py-3 font-mono">{row.conversionPercent.toFixed(1)}%</td>
                <td className="px-4 py-3">
                  {row.fabricApproved}/{row.fabricTotal}
                </td>
                <td className="px-4 py-3 font-mono font-semibold text-primary">{row.compositeScore.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-outline/10 bg-surface-container-low p-6 dark:border-outline/15">
        <h2 className="font-heading text-lg font-bold">{m.heatmapTitle}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{m.heatmapSubtitle}</p>
        <p className="mt-2 text-xs text-on-surface-variant">{d.heatmap.footnote}</p>
        <div className="mt-6 space-y-1 overflow-x-auto">
          <div
            className="grid min-w-[640px] gap-1"
            style={{
              gridTemplateColumns: `140px repeat(${d.heatmap.weekLabels.length}, minmax(32px, 1fr))`
            }}
          >
            <div />
            {d.heatmap.weekLabels.map((w) => (
              <div key={w} className="text-center text-[10px] font-bold text-on-surface-variant">
                {w}
              </div>
            ))}
          </div>
          {d.heatmap.supplierLabels.map((label, ri) => (
            <div
              key={label}
              className="grid min-w-[640px] gap-1"
              style={{
                gridTemplateColumns: `140px repeat(${d.heatmap.weekLabels.length}, minmax(32px, 1fr))`
              }}
            >
              <div className="flex items-center py-1 text-xs font-semibold">
                <span className="line-clamp-2">{label}</span>
              </div>
              {d.heatmap.cells[ri]?.map((intensity, ci) => (
                <div
                  key={`c-${ri}-${ci}`}
                  className="h-10 rounded-md border border-outline/5"
                  style={{
                    background: `color-mix(in srgb, var(--primary) ${intensity}%, white)`
                  }}
                  title={`${intensity}%`}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      {q.isError ? (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">
            {q.error instanceof Error ? q.error.message : m.loadError}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void q.refetch()}>
            {m.retry}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
