import type { Metadata } from 'next'

import { SalesPerformanceDashboardClient } from '@/components/admin/sales-performance/sales-performance-dashboard-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.salesPerformance.title,
    description: m.admin.meta.salesPerformance.description
  }
}

export default async function AdminSalesPerformancePage() {
  await requireAdminOrRedirect()
  return <SalesPerformanceDashboardClient />
}
