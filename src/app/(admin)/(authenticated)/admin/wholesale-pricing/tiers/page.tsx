import type { Metadata } from 'next'
import { Suspense } from 'react'

import { WholesalePricingRouteSkeleton } from '@/components/admin/wholesale-pricing/wholesale-pricing-route-skeleton'
import { WholesalePricingTiersWorkspace } from '@/components/admin/wholesale-pricing/wholesale-pricing-tiers-workspace'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.wholesalePricingTiers.title,
    description: m.admin.meta.wholesalePricingTiers.description
  }
}

export default async function WholesalePricingTiersPage() {
  await requireAdminOrRedirect()
  return (
    <Suspense fallback={<WholesalePricingRouteSkeleton />}>
      <WholesalePricingTiersWorkspace layout="admin" />
    </Suspense>
  )
}
