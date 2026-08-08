import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { FabricService } from '@/services/fabric.service'
import { getFabricDetailBySlugCached } from '@/lib/marketplace/fabric-detail-cache'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { FabricCardSkeleton } from '@/components/marketplace/FabricCard'
import { FabricDetailWebVGallery, FabricDetailWebVStacks } from '@/components/marketplace/fabric-detail-web-v-left'
import { ProductInfoPanel } from '@/components/marketplace/ProductInfoPanel'
import { ProductTabs } from '@/components/marketplace/ProductTabs'
import { RelatedFabrics } from '@/components/marketplace/RelatedFabrics'
import { generateFabricJsonLdForLocale, generateFabricMetadataForLocale } from '@/lib/utils/seo'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { getLocalizedFabricTitle } from '@/lib/i18n/localized-fabric'
import { getMessages } from '@/lib/i18n/get-messages'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const locale = await getServerLocale()
  const m = getMessages(locale)
  try {
    const fabric = await getFabricDetailBySlugCached(slug)
    if (!fabric) {
      return {
        title: `${m.fabrics.detailNotFoundTitle} | TkanMarket`,
        description: m.fabrics.detailNotFoundDescription
      }
    }
    return generateFabricMetadataForLocale(fabric, locale)
  } catch {
    return {
      title: `${m.fabrics.detailNotFoundTitle} | TkanMarket`,
      description: m.fabrics.detailNotFoundDescription
    }
  }
}

export default async function FabricDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getServerLocale()
  const m = getMessages(locale)
  let fabric
  try {
    fabric = await getFabricDetailBySlugCached(slug)
  } catch {
    notFound()
  }
  if (!fabric) {
    notFound()
  }

  const title = getLocalizedFabricTitle(fabric, locale)

  // Fire-and-forget view tracking — never blocks render.
  void FabricService.incrementViewsCount(fabric.id)

  return (
    <PublicPageShell className="py-10 md:py-14" blur="sm" contentClassName="space-y-10">
      <div className="w-full min-w-0">
        <Breadcrumb
          className="mb-8 md:mb-10"
          items={[
            { label: m.breadcrumbs.home, href: withLocaleUrl('/', locale) },
            { label: m.breadcrumbs.catalog, href: withLocaleUrl('/fabrics', locale) },
            { label: title }
          ]}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFabricJsonLdForLocale(fabric, locale)) }}
        />

        {/*
          Mobile (`design/mobile-v.html`): gallery (edge-to-edge) → identity/price → metrics/care/trace → tabs.
          lg+: gallery + stacks col 1–7; sticky info col 8–12 spans two rows.
        */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-10 xl:gap-x-12">
          <div className="max-lg:-mx-6 min-w-0 lg:col-span-7 lg:row-start-1">
            <FabricDetailWebVGallery fabric={fabric} title={title} />
          </div>
          <div className="min-w-0 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
            <div className="flex flex-col gap-8 max-lg:-mx-6 max-lg:bg-surface max-lg:px-6 max-lg:py-6 lg:sticky lg:top-24 lg:bg-transparent lg:px-0 lg:py-0">
              <ProductInfoPanel fabric={fabric} />
            </div>
          </div>
          <div className="min-w-0 lg:col-span-7 lg:col-start-1 lg:row-start-2">
            <FabricDetailWebVStacks fabric={fabric} messages={m.product.webV} />
          </div>
        </div>

        <section id="details" className="mt-12 w-full min-w-0 md:mt-16 lg:mt-20">
          <ProductTabs fabric={fabric} />
        </section>
      </div>

      <Suspense fallback={<RelatedFabricsSkeleton />}>
        <RelatedFabricsAsync fabricId={fabric.id} />
      </Suspense>
    </PublicPageShell>
  )
}

async function RelatedFabricsAsync({ fabricId }: { fabricId: number }) {
  const related = await FabricService.getRelated(fabricId, 8)
  return <RelatedFabrics fabrics={related} />
}

function RelatedFabricsSkeleton() {
  return (
    <section className="mx-auto w-full max-w-screen-2xl px-6 py-8 md:px-8">
      <div className="mb-8 space-y-2">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-surface-container/60" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-lg bg-surface-container/60" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <FabricCardSkeleton key={idx} />
        ))}
      </div>
    </section>
  )
}
