import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Verified } from 'lucide-react'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { FabricCatalogNoResults } from '@/components/marketplace/fabric-catalog-no-results'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { FilterSidebar } from '@/components/marketplace/FilterSidebar'
import { ActiveFilterTags } from '@/components/marketplace/ActiveFilterTags'
import { SortBar } from '@/components/marketplace/SortBar'
import { FabricGridClient } from '@/components/marketplace/FabricGridClient'
import { CatalogSearchHero } from '@/components/marketplace/CatalogSearchHero'
import { CatalogSpotlightBento } from '@/components/marketplace/CatalogSpotlightBento'
import { Pagination } from '@/components/marketplace/Pagination'
import { MobileFilterDrawer } from '@/components/marketplace/MobileFilterDrawer'

import type { Locale } from '@/types/i18n.types'
import { type FabricQueryParams, FabricQuerySchema } from '@/lib/validations/fabric.validation'
import { FabricService } from '@/services/fabric.service'
import { withPagination } from '@/lib/utils/api-response'
import { getMessages } from '@/lib/i18n/get-messages'
import type { Messages } from '@/lib/i18n/get-messages'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type SearchParamsRecord = Record<string, string | string[] | undefined>

function coerceSearchParams(sp: SearchParamsRecord) {
  const materialRaw = sp.material
  const material =
    typeof materialRaw === 'string'
      ? [materialRaw]
      : Array.isArray(materialRaw)
        ? materialRaw
        : undefined

  return {
    page: sp.page,
    limit: sp.limit,
    sort: sp.sort,
    q: sp.q,
    material,
    fabric_type: sp.fabric_type,
    gsm_min: sp.gsm_min,
    gsm_max: sp.gsm_max,
      price_usd_min: sp.price_usd_min,
      price_usd_max: sp.price_usd_max,
    width: sp.width,
    width_min: sp.width_min,
    width_max: sp.width_max,
    moq_min: sp.moq_min,
    moq_max: sp.moq_max,
    supplier_id: sp.supplier_id,
    category_slug: sp.category_slug,
    view:
      typeof sp.view === 'string' && (sp.view === 'list' || sp.view === 'grid')
        ? (sp.view as 'grid' | 'list')
        : undefined
  }
}

function fabricTypeLabel(m: Messages, fabricType: string) {
  const labels: Record<string, string> = m.fabrics.filters.types
  return labels[fabricType] ?? labels.other ?? fabricType
}

function catalogMetadataSegments(
  m: Messages,
  filters: ReturnType<typeof FabricQuerySchema.parse>
): string[] {
  const segments: string[] = []
  const categorySlug = filters.category_slug?.trim()
  if (categorySlug) {
    segments.push(`${m.fabrics.filters.catalogCategoryTag}: ${categorySlug}`)
  }
  const material = filters.material?.[0]
  if (material) segments.push(String(material))
  if (filters.fabric_type) {
    segments.push(fabricTypeLabel(m, filters.fabric_type))
  }
  return segments
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const sp = await searchParams
  const parsed = FabricQuerySchema.safeParse(coerceSearchParams(sp))
  const segments = parsed.success ? catalogMetadataSegments(m, parsed.data) : []
  const titlePrefix = segments.length > 0 ? segments.join(' · ') : m.fabrics.catalogTitle
  const title = `${titlePrefix} – ${m.breadcrumbs.catalog} | TkanMarket`
  const description =
    segments.length > 0 ? `${segments.join(' · ')}. ${m.fabrics.metaDescription}` : m.fabrics.metaDescription
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ['/og-placeholder.svg']
    }
  }
}

export default async function FabricsCatalogPage({ searchParams }: PageProps) {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const sp = await searchParams
  const params = FabricQuerySchema.parse(coerceSearchParams(sp))

  return (
    <PublicPageShell className="pb-12 pt-10 md:pb-16 md:pt-12" blur="sm" contentClassName="space-y-8">
      <Breadcrumb
        items={[{ label: m.breadcrumbs.home, href: withLocaleUrl('/', locale) }, { label: m.breadcrumbs.fabricsCatalog }]}
      />

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 space-y-6">
            <Suspense fallback={<FilterSidebarSkeleton />}>
              <FilterSidebarAsync currentFilters={params} m={m} />
            </Suspense>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          <Suspense fallback={<CatalogResultsSkeleton view={params.view} />}>
            <CatalogResultsAsync params={params} locale={locale} m={m} />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={null}>
        <MobileFilterDrawerAsync currentFilters={params} />
      </Suspense>
    </PublicPageShell>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Streaming sub-trees: each fetches its own data so the page shell flushes
// instantly and DB-bound regions stream in independently.
// ────────────────────────────────────────────────────────────────────────────

async function FilterSidebarAsync({
  currentFilters,
  m
}: {
  currentFilters: FabricQueryParams
  m: Messages
}) {
  const [categoryCounts, junctionCategoryCounts] = await Promise.all([
    FabricService.getCategoryCounts(),
    FabricService.getJunctionCategoryCounts()
  ])
  const sr = m.fabrics.searchResults

  return (
    <>
      <FilterSidebar
        currentFilters={currentFilters}
        categoryCounts={categoryCounts}
        junctionCategoryCounts={junctionCategoryCounts}
      />
      <div className="rounded-2xl bg-primary-fixed/30 p-6 dark:bg-primary/20">
        <Verified className="mb-3 h-8 w-8 text-primary" aria-hidden />
        <p className="text-sm font-bold text-on-primary-fixed dark:text-on-primary">{sr.trustTitle}</p>
        <p className="mt-1 text-xs leading-relaxed text-on-primary-fixed-variant dark:text-on-surface-variant">
          {sr.trustBody}
        </p>
      </div>
    </>
  )
}

async function CatalogResultsAsync({
  params,
  locale,
  m
}: {
  params: FabricQueryParams
  locale: Locale
  m: Messages
}) {
  const [result, junctionCategoryCounts] = await Promise.all([
    FabricService.list(params),
    FabricService.getJunctionCategoryCounts()
  ])

  const meta = withPagination(result.items, result.total, params.page, params.limit).meta
  const supplierCount = result.supplierCount ?? 0
  const q = params.q?.trim() ?? ''
  const sr = m.fabrics.searchResults

  return (
    <>
      <CatalogSearchHero
        query={q.length > 0 ? q : undefined}
        totalFabrics={result.total}
        supplierCount={supplierCount}
        titleCatalog={m.fabrics.catalogTitle}
        subtitleCatalog={m.fabrics.catalogSubtitle}
        searchTitlePrefix={sr.titlePrefix}
        searchSubtitle={sr.subtitle}
        refinePlaceholder={sr.refinePlaceholder}
        refineSubmit={sr.refineSubmit}
        chipAll={sr.chipAll}
        chipThisQuery={sr.chipQuery}
        foundPrefix={m.sort.foundPrefix}
        foundSuffix={m.sort.foundSuffix}
      />
      <ActiveFilterTags currentFilters={params} />
      <SortBar total={result.total} currentSort={params.sort} currentView={params.view} />
      {result.items.length === 0 ? (
        <FabricCatalogNoResults topCategories={junctionCategoryCounts} />
      ) : params.view === 'list' ? (
        <FabricGridClient
          items={result.items}
          view="list"
          showWishlist
          priorityCount={params.page === 1 ? 6 : 0}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <FabricGridClient
            items={result.items.slice(0, 4)}
            view="grid"
            showWishlist
            gridClassName="contents"
            priorityCount={params.page === 1 ? 6 : 0}
          />
          {params.page === 1 && result.items[0] ? (
            <CatalogSpotlightBento
              locale={locale}
              fabric={result.items[0]}
              badge={sr.spotlightBadge}
              title={sr.spotlightTitle}
              body={sr.spotlightBody}
              cta={sr.spotlightCta}
            />
          ) : null}
          <FabricGridClient
            items={result.items.slice(4)}
            view="grid"
            showWishlist
            gridClassName="contents"
          />
        </div>
      )}
      <Pagination page={meta.page} totalPages={meta.totalPages} />
    </>
  )
}

async function MobileFilterDrawerAsync({ currentFilters }: { currentFilters: FabricQueryParams }) {
  const [categoryCounts, junctionCategoryCounts] = await Promise.all([
    FabricService.getCategoryCounts(),
    FabricService.getJunctionCategoryCounts()
  ])
  return (
    <MobileFilterDrawer
      currentFilters={currentFilters}
      categoryCounts={categoryCounts}
      junctionCategoryCounts={junctionCategoryCounts}
    />
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Skeletons
// ────────────────────────────────────────────────────────────────────────────

function FilterSidebarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full animate-pulse rounded-2xl bg-surface-container/60" />
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="space-y-2 rounded-2xl border border-outline/10 bg-surface-container-lowest p-4">
          <div className="h-4 w-24 animate-pulse rounded bg-surface-container/60" />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-3 w-full animate-pulse rounded bg-surface-container/60" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CatalogResultsSkeleton({ view }: { view: 'grid' | 'list' | undefined }) {
  const isList = view === 'list'
  return (
    <>
      <div className="space-y-3 rounded-3xl border border-outline/10 bg-surface-container-lowest p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-surface-container/60" />
        <div className="h-7 w-72 animate-pulse rounded-xl bg-surface-container/60" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-xl bg-surface-container/60" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="h-6 w-40 animate-pulse rounded bg-surface-container/60" />
        <div className="h-9 w-36 animate-pulse rounded-full bg-surface-container/60" />
      </div>
      {isList ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="flex gap-4 rounded-3xl border border-outline/10 bg-surface-container-lowest p-4">
              <div className="h-36 w-48 shrink-0 animate-pulse rounded-2xl bg-surface-container/60" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 animate-pulse rounded bg-surface-container/60" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-surface-container/60" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-surface-container/60" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-16 animate-pulse rounded-full bg-surface-container/60" />
                  <div className="h-6 w-16 animate-pulse rounded-full bg-surface-container/60" />
                  <div className="h-6 w-20 animate-pulse rounded-full bg-surface-container/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={idx} className="overflow-hidden rounded-3xl border border-outline/10 bg-surface-container-lowest">
              <div className="aspect-[4/3] w-full animate-pulse bg-surface-container/60" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-24 animate-pulse rounded bg-surface-container/60" />
                <div className="h-5 w-full animate-pulse rounded bg-surface-container/60" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-16 animate-pulse rounded-full bg-surface-container/60" />
                  <div className="h-6 w-16 animate-pulse rounded-full bg-surface-container/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

