import type { Metadata } from 'next'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { FabricCompareClient } from '@/components/marketplace/FabricCompareClient'
import { FabricService } from '@/services/fabric.service'
import { getMessages } from '@/lib/i18n/get-messages'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function parseCompareIds(sp: Record<string, string | string[] | undefined>): number[] {
  const raw = sp.ids
  const s = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : ''
  if (!s || typeof s !== 'string') return []
  return s
    .split(',')
    .map((x) => Number(String(x).trim()))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 4)
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const title = `${m.fabrics.compare.metaTitle} | TkanMarket`
  return {
    title,
    description: m.fabrics.compare.metaDescription,
    openGraph: { title, description: m.fabrics.compare.metaDescription }
  }
}

export default async function FabricComparePage({ searchParams }: PageProps) {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const sp = await searchParams
  const requestedIds = parseCompareIds(sp)
  const initialFabrics =
    requestedIds.length > 0 ? await FabricService.getByIdsForCompare(requestedIds) : []

  return (
    <PublicPageShell className="min-h-[60vh] pb-12 pt-8 md:pb-16 md:pt-10" blur="sm" contentClassName="space-y-6">
      <Breadcrumb
        items={[
          { label: m.breadcrumbs.home, href: withLocaleUrl('/', locale) },
          { label: m.breadcrumbs.catalog, href: withLocaleUrl('/fabrics', locale) },
          { label: m.fabrics.compare.breadcrumb }
        ]}
      />
      <FabricCompareClient requestedIds={requestedIds} initialFabrics={initialFabrics} />
    </PublicPageShell>
  )
}
