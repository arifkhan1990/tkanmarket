import type { Metadata } from 'next'
import { Suspense } from 'react'

import { WholesalePricingRouteSkeleton } from '@/components/admin/wholesale-pricing/wholesale-pricing-route-skeleton'
import { WholesalePricingTiersWorkspace } from '@/components/admin/wholesale-pricing/wholesale-pricing-tiers-workspace'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.supplierWholesalePricing.title,
    description: m.admin.meta.supplierWholesalePricing.description
  }
}

export default async function SupplierWholesalePricingPage(props: Props) {
  await requireAdminOrRedirect()
  const { id: idRaw } = await props.params
  const supplierId = Number(idRaw)
  if (!Number.isFinite(supplierId) || supplierId < 1) {
    return <div className="p-8 text-sm text-destructive">Invalid supplier</div>
  }
  return (
    <Suspense fallback={<WholesalePricingRouteSkeleton />}>
      <WholesalePricingTiersWorkspace layout="supplier" supplierId={supplierId} />
    </Suspense>
  )
}
