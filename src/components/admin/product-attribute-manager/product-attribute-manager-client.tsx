'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  Database,
  ExternalLink,
  Eye,
  Layers,
  List,
  RefreshCw,
  Sparkles,
  Tag
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import {
  dashboardStatLabelClass,
  dashboardStatValueClass
} from '@/components/admin/dashboard-stat-card-tones'
import { ProductAttributeManagerSkeleton } from '@/components/admin/product-attribute-manager/product-attribute-manager-skeleton'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton/StatCardSkeleton'
import { useFabricTaxonomyQuery } from '@/hooks/admin/useFabricTaxonomyQuery'
import { useProductAttributesQuery } from '@/hooks/admin/useProductAttributesQuery'
import { useI18n } from '@/hooks/useI18n'
import { interpolate } from '@/lib/i18n/interpolate'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import type { FabricTaxonomySampleFabric } from '@/types/admin-fabric-taxonomy.types'
import type { Locale } from '@/types/i18n.types'

type Copy = ReturnType<typeof useI18n>['messages']['admin']['productAttributeManagerPage']
type OverviewCopy = ReturnType<typeof useI18n>['messages']['admin']['productAttributesOverviewPage']

function localeFor(loc: Locale): string {
  return loc === 'ru' ? 'ru-RU' : loc === 'zh' ? 'zh-CN' : 'en-US'
}

function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(localeFor(locale)).format(n)
}

export function ProductAttributeManagerClient() {
  const { messages, locale } = useI18n()
  const p = messages.admin.productAttributeManagerPage
  const ov = messages.admin.productAttributesOverviewPage
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const initialCategory = searchParams.get('category') ?? undefined
  const [categorySlug, setCategorySlug] = React.useState<string | undefined>(initialCategory)
  const [filterText, setFilterText] = React.useState('')

  const overview = useProductAttributesQuery()
  const taxonomy = useFabricTaxonomyQuery(categorySlug)

  const activeSlug = categorySlug ?? taxonomy.data?.selected_slug ?? undefined
  const categories = React.useMemo(() => taxonomy.data?.categories ?? [], [taxonomy.data])
  const sample = taxonomy.data?.sample
  const activity = React.useMemo(() => taxonomy.data?.activity ?? [], [taxonomy.data])
  const stats = overview.data?.stats
  const fabricTypes = React.useMemo(() => overview.data?.fabricTypes ?? [], [overview.data])
  const topTags = React.useMemo(() => overview.data?.topTags ?? [], [overview.data])

  // Sync category to URL.
  React.useEffect(() => {
    if (!activeSlug) return
    const params = new URLSearchParams(searchParams.toString())
    if (params.get('category') === activeSlug) return
    params.set('category', activeSlug)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [activeSlug, router, searchParams])

  const filteredCategories = React.useMemo(() => {
    const needle = filterText.trim().toLowerCase()
    if (!needle) return categories
    return categories.filter((c) => c.slug.toLowerCase().includes(needle))
  }, [categories, filterText])

  const onRefresh = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-product-attributes'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-fabric-taxonomy'] })
    ])
  }, [queryClient])

  const isFetching = overview.isFetching || taxonomy.isFetching
  const lastSync = overview.dataUpdatedAt
    ? interpolate(p.lastSync, {
        time: formatDistanceToNow(new Date(overview.dataUpdatedAt), { addSuffix: true })
      })
    : null

  return (
    <div className="space-y-6 pb-10">
      <Header
        p={p}
        onRefresh={onRefresh}
        isFetching={isFetching}
        lastSync={lastSync}
        locale={locale}
      />

      {/* KPI strip */}
      {stats ? (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <DashboardStatCardShell tone="blue">
            <p className={dashboardStatLabelClass}>{ov.statTotalFabrics}</p>
            <p className={cn(dashboardStatValueClass, 'font-heading')}>
              {formatNumber(stats.totalFabrics, locale)}
            </p>
          </DashboardStatCardShell>
          <DashboardStatCardShell tone="green">
            <p className={dashboardStatLabelClass}>{ov.statWithGsm}</p>
            <p className={cn(dashboardStatValueClass, 'font-heading')}>
              {formatNumber(stats.withGsm, locale)}
            </p>
          </DashboardStatCardShell>
          <DashboardStatCardShell tone="yellow">
            <p className={dashboardStatLabelClass}>{ov.statAvgGsm}</p>
            <p className={cn(dashboardStatValueClass, 'font-heading')}>
              {stats.avgGsm != null ? formatNumber(stats.avgGsm, locale) : '—'}
            </p>
          </DashboardStatCardShell>
          <DashboardStatCardShell tone="blue">
            <p className={dashboardStatLabelClass}>{ov.statWithComposition}</p>
            <p className={cn(dashboardStatValueClass, 'font-heading')}>
              {formatNumber(stats.withComposition, locale)}
            </p>
          </DashboardStatCardShell>
        </section>
      ) : overview.isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : null}

      {/* Catalog-wide insight panels — fabric type breakdown + top tags */}
      <CatalogInsights
        fabricTypes={fabricTypes}
        topTags={topTags}
        loading={overview.isLoading}
        copy={p}
        ov={ov}
        locale={locale}
      />

      {/* Taxonomy + sample */}
      {taxonomy.isLoading && !taxonomy.data ? (
        <ProductAttributeManagerSkeleton aria-label={p.loading} />
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline/20 bg-surface-container-low p-10 text-center text-sm text-on-surface-variant">
          {p.emptyTaxonomy}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Category list */}
          <section className="lg:col-span-4">
            <div className="space-y-4 rounded-2xl border border-outline/15 bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {p.fabricTaxonomy}
                </h2>
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-mono text-[10px] font-bold text-on-surface-variant">
                  {categories.length}
                </span>
              </div>
              <Input
                type="search"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder={p.fabricTaxonomy}
                className="h-9 text-sm"
                aria-label={p.fabricTaxonomy}
              />
              <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
                {filteredCategories.map((c) => {
                  const active = c.slug === activeSlug
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => setCategorySlug(c.slug)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                        active
                          ? 'bg-primary/10 font-bold text-primary ring-1 ring-primary/20'
                          : 'hover:bg-surface-container-high text-on-surface'
                      )}
                      aria-pressed={active}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Layers className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                        <span className="line-clamp-2 break-all">{c.slug}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-mono text-[10px] text-on-surface-variant">
                        {interpolate(p.attrsCount, { n: formatNumber(c.fabric_count, locale) })}
                      </span>
                    </button>
                  )
                })}
              </div>
              <Button asChild type="button" variant="outline" size="sm" className="w-full rounded-xl">
                <Link href={withLocaleUrl('/admin/fabrics', locale)}>
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
                  {p.manageCategories}
                </Link>
              </Button>
            </div>
          </section>

          {/* Sample fabric panel + activity */}
          <section className="space-y-6 lg:col-span-8">
            <SampleFabricCard sample={sample} activeSlug={activeSlug} copy={p} locale={locale} />
            <SamplePreviewCard sample={sample} copy={p} locale={locale} />
            <ActivityTable rows={activity} copy={p} />
          </section>
        </div>
      )}
    </div>
  )
}

function Header({
  p,
  onRefresh,
  isFetching,
  lastSync,
  locale
}: {
  p: Copy
  onRefresh: () => void
  isFetching: boolean
  lastSync: string | null
  locale: Locale
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            {p.title}
          </h1>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">{p.subtitle}</p>
        {lastSync ? (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-outline">{lastSync}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={onRefresh}
          disabled={isFetching}
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} aria-hidden />
          {p.refresh}
        </Button>
        <Button asChild type="button" variant="outline" size="sm" className="rounded-full">
          <Link href={withLocaleUrl('/admin/fabrics', locale)}>
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
            {p.manageCategories}
          </Link>
        </Button>
      </div>
    </header>
  )
}

function CatalogInsights({
  fabricTypes,
  topTags,
  loading,
  copy,
  ov,
  locale
}: {
  fabricTypes: { fabricType: string | null; count: number }[]
  topTags: { tag: string; count: number }[]
  loading: boolean
  copy: Copy
  ov: OverviewCopy
  locale: Locale
}) {
  const totalFabricsForTypes = fabricTypes.reduce((acc, r) => acc + r.count, 0)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Fabric type breakdown */}
      <section className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
            <List className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-base font-extrabold tracking-tight text-on-surface">
              {copy.fabricTypeBreakdownTitle}
            </h2>
            <p className="text-xs text-on-surface-variant">{copy.fabricTypeBreakdownSubtitle}</p>
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        ) : fabricTypes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-outline/20 p-4 text-center text-xs text-on-surface-variant">
            {copy.emptyFabricTypes}
          </p>
        ) : (
          <ul className="space-y-3">
            {fabricTypes.map((row) => {
              const pct =
                totalFabricsForTypes > 0
                  ? Math.max(2, Math.round((row.count / totalFabricsForTypes) * 100))
                  : 0
              return (
                <li key={row.fabricType ?? '__null__'}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-on-surface">
                      {row.fabricType ?? (
                        <span className="italic text-on-surface-variant">{copy.noFabricType}</span>
                      )}
                    </span>
                    <span className="font-mono tabular-nums text-on-surface-variant">
                      {formatNumber(row.count, locale)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                    <div
                      className="h-full rounded-full bg-violet-500 dark:bg-violet-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Top tags */}
      <section className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            <Tag className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-base font-extrabold tracking-tight text-on-surface">
              {copy.topTagsTitle}
            </h2>
            <p className="text-xs text-on-surface-variant">{copy.topTagsSubtitle}</p>
          </div>
        </div>
        {loading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        ) : topTags.length === 0 ? (
          <p className="rounded-lg border border-dashed border-outline/20 p-4 text-center text-xs text-on-surface-variant">
            {copy.emptyTopTags}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {topTags.map((t) => (
              <li
                key={t.tag}
                className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1.5 text-xs"
              >
                <span className="font-bold text-on-surface">{t.tag}</span>
                <span className="font-mono text-[10px] text-on-surface-variant">
                  {formatNumber(t.count, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 flex items-center gap-1 text-[10px] uppercase tracking-widest text-outline">
          <Database className="h-3 w-3" aria-hidden />
          {ov.statTotalFabrics}
        </p>
      </section>
    </div>
  )
}

function SampleFabricCard({
  sample,
  activeSlug,
  copy,
  locale
}: {
  sample: FabricTaxonomySampleFabric | null | undefined
  activeSlug: string | undefined
  copy: Copy
  locale: Locale
}) {
  return (
    <section className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm md:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
            {copy.sampleHeading}
          </p>
          <h2 className="mt-1 font-heading text-xl font-extrabold tracking-tight text-on-surface">
            {sample?.title_en ?? sample?.title_ru ?? '—'}
          </h2>
          <p className="font-mono text-xs text-on-surface-variant">
            {copy.sampleSubtitle} · <span className="text-primary">{activeSlug ?? '—'}</span>
          </p>
        </div>
        {sample ? (
          <Button asChild type="button" variant="outline" size="sm" className="rounded-xl">
            <Link href={withLocaleUrl(`/admin/fabrics/${sample.id}`, locale)}>
              <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
              {copy.openInEditor}
            </Link>
          </Button>
        ) : null}
      </div>

      {!sample ? (
        <p className="rounded-lg border border-dashed border-outline/20 p-6 text-center text-sm text-on-surface-variant">
          {copy.noSample}
        </p>
      ) : (
        <>
          <p className="mb-4 flex items-center gap-1 text-[10px] uppercase tracking-widest text-outline">
            <Database className="h-3 w-3" aria-hidden />
            {copy.viewOnlyHint}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Spec
              label={copy.gsmLabel}
              value={sample.gsm != null ? `${sample.gsm} ${copy.gsmUnit}` : '—'}
            />
            <Spec
              label={copy.widthLabel}
              value={sample.width_cm != null ? `${sample.width_cm} cm` : '—'}
            />
            <Spec label={copy.compositionLabel} value={sample.composition_label ?? '—'} />
            <Spec label={copy.typeLabel} value={sample.fabric_type ?? '—'} />
          </div>
        </>
      )}
    </section>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline/15 bg-surface-container-low p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-1 font-mono text-sm font-bold text-on-surface">{value}</p>
    </div>
  )
}

function SamplePreviewCard({
  sample,
  copy,
  locale
}: {
  sample: FabricTaxonomySampleFabric | null | undefined
  copy: Copy
  locale: Locale
}) {
  if (!sample) return null
  const primaryImage = sample.images?.[0] ?? null
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 px-1">
        <Eye className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface">{copy.previewTitle}</h3>
      </div>
      <div className="overflow-hidden rounded-2xl border border-outline/15 bg-surface-container-low shadow-sm">
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-[4/3] min-h-[220px] w-full md:aspect-auto md:min-h-[280px]">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={sample.title_en ?? sample.title_ru}
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 400px"
                unoptimized={isRemoteImageSrc(primaryImage)}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-surface-container-high text-xs text-on-surface-variant">
                —
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between p-6 md:p-8">
            <div>
              <h3 className="font-heading text-lg font-bold text-on-surface">
                {sample.title_en ?? sample.title_ru}
              </h3>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-on-surface-variant">{copy.gsmLabel}</span>
                  <span className="font-mono font-bold">
                    {sample.gsm != null ? `${sample.gsm} ${copy.gsmUnit}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-on-surface-variant">{copy.widthLabel}</span>
                  <span className="font-mono font-bold">
                    {sample.width_cm != null ? `${sample.width_cm} cm` : '—'}
                  </span>
                </div>
              </div>
            </div>
            <Button asChild className="mt-6 w-full rounded-xl" variant="default">
              <Link href={withLocaleUrl(`/admin/fabrics/${sample.id}`, locale)}>
                {copy.viewDetails}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityTable({
  rows,
  copy
}: {
  rows: { id: number; event_type: string; message: string; created_at: string }[]
  copy: Copy
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-outline/15 bg-surface-container-lowest shadow-sm">
      <div className="border-b border-outline/10 px-4 py-3 md:px-6">
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {copy.revisionHistory}
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-surface-container-low/80 hover:bg-surface-container-low/80">
            <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">
              {copy.tableField}
            </TableHead>
            <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">
              {copy.tableChange}
            </TableHead>
            <TableHead className="text-right text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">
              {copy.tableTime}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="py-8 text-center text-xs text-on-surface-variant">
                {copy.noActivity}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Badge intent="brand" className="font-mono text-[10px] normal-case tracking-normal">
                    {row.event_type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md text-sm text-on-surface">{row.message}</TableCell>
                <TableCell className="text-right font-mono text-[11px] text-on-surface-variant">
                  {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
