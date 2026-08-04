import type { Metadata } from 'next'

import { AdminPricingAnalysisClient } from '@/components/admin/pricing/AdminPricingAnalysisClient'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.pricingAnalysis.title,
    description: m.admin.meta.pricingAnalysis.description
  }
}

export default async function PricingAnalysisPage() {
  await requireAdminOrRedirect()
  return <AdminPricingAnalysisClient />
}
