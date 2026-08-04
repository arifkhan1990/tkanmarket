import type { Metadata } from 'next'

import { SupplierAnalyticsClient } from '@/components/admin/suppliers/SupplierAnalyticsClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.supplierAnalyticsPage.title} | TkanMarket Admin`,
    description: m.admin.supplierAnalyticsPage.subtitle
  }
}

export default function AdminSupplierAnalyticsPage() {
  return <SupplierAnalyticsClient />
}
