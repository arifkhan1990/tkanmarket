'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, MessageCircle, Package, Warehouse } from 'lucide-react'

import { usePublicOrderTrackingQuery } from '@/hooks/usePublicOrderTracking'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import type { PublicOrderTrackingTimelineStep } from '@/types/public-order-tracking.types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function OrderTrackingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 md:px-8">
      <Skeleton className="h-10 w-2/3 max-w-md" />
      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-96 rounded-3xl lg:col-span-8" />
        <Skeleton className="h-64 rounded-3xl lg:col-span-4" />
      </div>
    </div>
  )
}

function StatusLabel({
  status,
  labels
}: {
  status: string
  labels: {
    statusProcessing: string
    statusInTransit: string
    statusDelivered: string
    statusOnHold: string
  }
}) {
  const map: Record<string, string> = {
    PROCESSING: labels.statusProcessing,
    IN_TRANSIT: labels.statusInTransit,
    DELIVERED: labels.statusDelivered,
    ON_HOLD: labels.statusOnHold
  }
  return <span className="text-sm font-semibold text-primary">{map[status] ?? status}</span>
}

export function OrderTrackingPageClient({ orderReference }: { orderReference: string }) {
  const { messages, locale } = useI18n()
  const p = messages.orderTrackingPage
  const q = usePublicOrderTrackingQuery(orderReference, p.loadError)

  if (q.isLoading && !q.data) {
    return <OrderTrackingSkeleton />
  }

  if (!q.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-on-surface-variant">
        <p>{p.loadError}</p>
        <Button asChild className="mt-6" variant="secondary">
          <Link href={withLocaleUrl('/bulk-inquiry', locale)}>{p.contactSupplier}</Link>
        </Button>
      </div>
    )
  }

  const d = q.data
  const valueLabel =
    d.estimated_value_usd !== null
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(d.estimated_value_usd)
      : '—'

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            #{d.order_reference}
          </h1>
          <p className="mt-1 text-lg text-on-surface-variant">{d.buyer_company_name}</p>
          <div className="mt-2">
            <StatusLabel status={d.status} labels={p} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" disabled>
            {p.invoiceSoon}
          </Button>
          <Button asChild className="bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-md">
            <Link href={withLocaleUrl(`/suppliers/${d.supplier.slug}`, locale)}>
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
              {p.contactSupplier}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-[2rem] border border-outline/15 bg-surface-container-lowest p-8 shadow-sm lg:col-span-8">
          <h2 className="mb-8 flex items-center gap-2 font-heading text-xl font-bold text-on-surface">
            <Package className="h-5 w-5 text-primary" aria-hidden />
            {p.fulfillmentTitle}
          </h2>
          <div className="relative space-y-10 pl-2 md:pl-4">
            <div className="absolute bottom-4 left-[27px] top-4 w-0.5 bg-surface-container md:left-[31px]" aria-hidden />
            {d.timeline.map((step: PublicOrderTrackingTimelineStep) => (
              <div key={step.id} className="relative flex gap-6">
                <div className="relative z-10 flex w-8 shrink-0 justify-center md:w-10">
                  {step.state === 'done' ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary shadow-md">
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                    </span>
                  ) : step.state === 'current' ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background shadow-md">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    </span>
                  ) : (
                    <span className="mt-1 h-6 w-6 rounded-full border border-outline-variant bg-surface-container-high" />
                  )}
                </div>
                <div className={cn('min-w-0 flex-1 pb-2', step.state === 'pending' && 'opacity-50')}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3
                      className={cn(
                        'font-heading text-lg font-bold',
                        step.state === 'current' ? 'text-primary' : 'text-on-surface'
                      )}
                    >
                      {step.title}
                    </h3>
                    {step.dateLabel ? (
                      <span className="rounded-md bg-surface-container-low px-2 py-1 font-mono text-xs text-on-surface-variant">
                        {step.dateLabel}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">{step.description}</p>
                  {step.progressPercent !== null && step.state === 'current' ? (
                    <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${step.progressPercent}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-[2rem] border border-outline/10 bg-surface-container-low p-6">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{p.supplierTitle}</h3>
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-surface-container-high shadow">
                {d.supplier.logo_url ? (
                  <Image
                    src={d.supplier.logo_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-heading font-bold text-primary">
                    {d.supplier.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-heading font-bold text-on-surface">{d.supplier.name}</p>
                <p className="text-xs text-on-surface-variant">
                  {[d.supplier.city, d.supplier.country].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href={withLocaleUrl(`/suppliers/${d.supplier.slug}`, locale)}>{p.viewProfile}</Link>
            </Button>
          </div>

          <div className="rounded-[2rem] border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              <Warehouse className="h-4 w-4 text-primary-container" aria-hidden />
              {p.shippingTitle}
            </h3>
            <p className="font-semibold text-on-surface">{d.shipping_summary.label}</p>
            <p className="mt-4 text-xs font-bold uppercase text-on-surface-variant">{p.carrier}</p>
            <p className="text-sm font-semibold text-primary">{d.shipping_summary.carrier_preference}</p>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-primary to-primary-container p-6 text-on-primary shadow-lg">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest opacity-80">{p.summaryTitle}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>{p.totalWeight}</span>
                <span className="font-mono font-bold">{d.total_meters.toLocaleString()} m</span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-3">
                <span className="text-lg font-bold">{p.totalValue}</span>
                <span className="font-mono text-xl font-extrabold">{valueLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-outline/10 bg-surface-container-low">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline/10 px-6 py-5 md:px-10">
          <h2 className="font-heading text-xl font-bold">{p.manifestTitle}</h2>
          <span className="rounded-full bg-surface-container-lowest px-3 py-1 font-mono text-xs font-bold text-on-surface-variant">
            {d.manifest_lines.length}
          </span>
        </div>
        <p className="px-6 py-3 text-sm text-on-surface-variant md:px-10">{p.manifestNote}</p>
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">{p.manifestTitle}</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/10">
              {d.manifest_lines.map((line) => (
                <tr key={line.sku} className="hover:bg-surface-container-lowest/60">
                  <td className="px-4 py-4 font-mono font-semibold text-primary">{line.sku}</td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-on-surface">{line.title}</p>
                    {line.subtitle ? <p className="text-xs text-on-surface-variant">{line.subtitle}</p> : null}
                  </td>
                  <td className="px-4 py-4 text-right font-mono">{line.quantity_label}</td>
                  <td className="px-4 py-4 text-right font-mono font-bold">{line.line_total_label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
