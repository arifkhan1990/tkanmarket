import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { parseYmdToUtcEnd, parseYmdToUtcStart } from '@/lib/admin/fabric-list-date-presets'
import { AdminFabricService } from '@/services/admin-fabric.service'
import { FabricManagementTable } from '@/components/admin/FabricManagementTable'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.fabrics.title,
    description: m.admin.meta.fabrics.description,
  }
}

export default async function AdminFabricsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdminOrRedirect()
  const locale = await getServerLocale()
  const messages = getMessages(locale)
  const pageCopy = messages.admin.fabricsModerationPage
  const sp = await searchParams
  const status = typeof sp.status === 'string' ? sp.status : undefined
  const q = typeof sp.q === 'string' ? sp.q : undefined
  const page = typeof sp.page === 'string' ? Number(sp.page) : 1
  const limit = typeof sp.limit === 'string' ? Number(sp.limit) : 12
  const supplierRaw = typeof sp.supplier_id === 'string' ? Number(sp.supplier_id) : NaN
  const supplierId = Number.isFinite(supplierRaw) && supplierRaw > 0 ? supplierRaw : undefined
  const cfRaw = typeof sp.created_from === 'string' ? sp.created_from : undefined
  const ctRaw = typeof sp.created_to === 'string' ? sp.created_to : undefined
  const categorySlug =
    typeof sp.category_slug === 'string' && sp.category_slug.trim().length > 0 ? sp.category_slug.trim() : undefined
  const createdFrom =
    cfRaw && /^\d{4}-\d{2}-\d{2}$/.test(cfRaw) ? parseYmdToUtcStart(cfRaw) ?? undefined : undefined
  const createdTo =
    ctRaw && /^\d{4}-\d{2}-\d{2}$/.test(ctRaw) ? parseYmdToUtcEnd(ctRaw) ?? undefined : undefined

  const initialData = await AdminFabricService.list({
    status: status as never,
    q,
    supplierId,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 12,
    createdFrom,
    createdTo,
    categorySlug
  })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-outline">
          <span>{messages.breadcrumbs.catalog}</span>
          <span aria-hidden className="text-outline/60">
            /
          </span>
          <span className="font-semibold text-primary">{pageCopy.title}</span>
        </nav>
        <h1 className="font-heading text-xl font-extrabold tracking-tight text-on-surface md:text-2xl">{pageCopy.title}</h1>
        <p className="text-sm text-on-surface-variant">{pageCopy.subtitle}</p>
      </div>
      <FabricManagementTable
        initialData={initialData}
        initialStatus={status}
        initialQ={q}
        initialPage={Number.isFinite(page) && page > 0 ? page : 1}
        initialLimit={Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 12}
        initialSupplierId={supplierId}
        initialCreatedFrom={cfRaw && /^\d{4}-\d{2}-\d{2}$/.test(cfRaw) ? cfRaw : undefined}
        initialCreatedTo={ctRaw && /^\d{4}-\d{2}-\d{2}$/.test(ctRaw) ? ctRaw : undefined}
        initialCategorySlug={categorySlug}
      />
    </div>
  )
}

