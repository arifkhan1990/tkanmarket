'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  HelpCircle,
  LineChart,
  Loader2,
  Package,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react'

import { useSupplierPartnerOverviewQuery } from '@/hooks/useSupplierPartnerOverview'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function PartnerSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 md:px-8">
      <Skeleton className="h-12 w-2/3" />
      <div className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-40 rounded-3xl md:col-span-2" />
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
    </div>
  )
}

export function PartnerPortalClient({ supplierSlug }: { supplierSlug: string }) {
  const { messages, locale } = useI18n()
  const p = messages.partnerPortalPage
  const q = useSupplierPartnerOverviewQuery(supplierSlug, p.loadError)

  if (q.isLoading && !q.data) {
    return <PartnerSkeleton />
  }

  if (!q.data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-on-surface-variant">{p.loadError}</p>
        <Button asChild className="mt-6" variant="secondary">
          <Link href={withLocaleUrl('/suppliers', locale)}>{p.browseSuppliers}</Link>
        </Button>
      </div>
    )
  }

  const d = q.data
  const delta = d.metrics.month_over_month_inquiry_delta_percent

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 md:px-8">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          {d.supplier.logo_url ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-high shadow-sm">
              <Image src={d.supplier.logo_url} alt="" fill className="object-contain p-1" sizes="64px" />
            </div>
          ) : null}
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{p.title}</h1>
            <p className="text-lg text-on-surface-variant">
              {d.supplier.name}
          {delta !== null ? (
            <>
              {' '}
              ·{' '}
              <span className="font-bold text-primary">
                {delta >= 0 ? '+' : ''}
                {delta}% MoM
              </span>
            </>
          ) : null}
            </p>
            {d.supplier.city ? (
              <p className="text-sm text-on-surface-variant">
                {d.supplier.city}, {d.supplier.country}
              </p>
            ) : (
              <p className="text-sm text-on-surface-variant">{d.supplier.country}</p>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 p-8 text-white shadow-xl md:col-span-2">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" aria-hidden />
              {d.supplier.verified ? p.premiumBadge : p.visibilityTitle}
            </div>
            <h2 className="font-heading text-2xl font-bold">{p.visibilityTitle}</h2>
            <p className="max-w-md text-sm text-white/90">{p.visibilityBody}</p>
            <Button asChild variant="secondary" className="mt-2 font-bold">
              <Link href={`/suppliers/${d.supplier.slug}`}>
                <LineChart className="mr-2 h-4 w-4" aria-hidden />
                {p.viewAll}
              </Link>
            </Button>
          </div>
          <Users className="pointer-events-none absolute -right-4 -bottom-4 h-40 w-40 text-white/10" aria-hidden />
        </div>

        <div className="rounded-3xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-primary">
            <Package className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-sm font-medium text-on-surface-variant">{p.sampleRequests}</p>
          <p className="font-mono text-3xl font-bold">{d.metrics.sample_request_leads}</p>
        </div>

        <div className="rounded-3xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <TrendingUp className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-sm font-medium text-on-surface-variant">{p.responseRate}</p>
          <p className="font-mono text-3xl font-bold">{d.metrics.response_rate_percent}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-xl font-bold">{p.topFabrics}</h3>
            <Link href={`/suppliers/${d.supplier.slug}`} className="text-sm font-bold text-primary hover:underline">
              {p.viewAll}
            </Link>
          </div>
          <ul className="space-y-3">
            {d.top_fabrics.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/fabrics/${f.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-outline/10 bg-surface-container-low p-4 transition-colors hover:bg-surface-container"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-container-high">
                    {f.image_url ? (
                      <Image src={f.image_url} alt="" fill className="object-cover" sizes="96px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-on-surface-variant">—</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                      {f.sku ?? `ID-${f.id}`}
                    </span>
                    <p className="font-heading font-bold text-on-surface">{f.title}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs font-mono font-bold text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                        {f.views_count} {p.views}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-outline transition-colors group-hover:text-primary" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          {d.top_fabrics.length === 0 ? (
            <p className="py-8 text-center text-on-surface-variant">{p.loadError}</p>
          ) : null}
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-outline/10 bg-surface-container-high p-6">
            <h3 className="mb-4 font-heading text-lg font-bold">{p.quickActions}</h3>
            <div className="space-y-2">
              <Button asChild variant="outline" className="h-auto w-full justify-between py-3">
                <Link href={withLocaleUrl(`/suppliers/${d.supplier.slug}`, locale)}>
                  {p.viewAll}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto w-full justify-between py-3">
                <Link href={withLocaleUrl('/fabrics', locale)}>
                  {p.addListing}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto w-full justify-between py-3">
                <Link href={withLocaleUrl('/contact', locale)}>
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" aria-hidden />
                    {p.messageSupport}
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-outline/10 bg-surface-container-lowest p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold">{p.inquiries}</h3>
              <span className="rounded bg-primary-fixed px-2 py-0.5 text-[10px] font-bold text-on-primary-fixed-variant">
                {p.newBadge}
              </span>
            </div>
            <ul className="space-y-4">
              {d.recent_inquiries.map((r) => (
                <li key={`${r.company_name}-${r.created_at}`} className="flex gap-3">
                  <span
                    className={cn(
                      'mt-2 h-2 w-2 shrink-0 rounded-full',
                      r.is_new ? 'bg-primary' : 'bg-outline-variant'
                    )}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-bold">{r.company_name}</p>
                    <p className="text-xs text-on-surface-variant">{r.inquiry_excerpt}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase text-on-surface-variant">
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {d.recent_inquiries.length === 0 ? (
              <p className="text-sm text-on-surface-variant">{p.loadError}</p>
            ) : null}
          </div>
        </aside>
      </div>

      {q.isFetching ? (
        <div className="flex justify-center py-4 text-on-surface-variant">
          <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
        </div>
      ) : null}
    </div>
  )
}
