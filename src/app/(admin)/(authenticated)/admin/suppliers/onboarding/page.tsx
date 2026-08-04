import type { Metadata } from 'next'

import { AdminSupplierOnboardingClient } from '@/components/admin/suppliers/admin-supplier-onboarding-client'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.supplierSuite.onboardingTitle} | TkanMarket Admin`,
    description: m.admin.supplierSuite.onboardingSubtitle
  }
}

export default function AdminSupplierOnboardingPage() {
  return <AdminSupplierOnboardingClient />
}
