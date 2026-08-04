import type { Metadata } from 'next'
import { Suspense } from 'react'

import { WholesalePricingRouteSkeleton } from '@/components/admin/wholesale-pricing/wholesale-pricing-route-skeleton'
import { WholesalePricingSimulatorClient } from '@/components/admin/wholesale-pricing/wholesale-pricing-simulator-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.wholesalePricingSimulator.title,
    description: m.admin.meta.wholesalePricingSimulator.description
  }
}

export default async function WholesalePricingSimulatorPage() {
  await requireAdminOrRedirect()
  return (
    <Suspense fallback={<WholesalePricingRouteSkeleton />}>
      <WholesalePricingSimulatorClient />
    </Suspense>
  )
}
