import type { Metadata } from 'next'

import { AdminCustomReportClient } from '@/components/admin/reports/AdminCustomReportClient'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.customReportBuilder.title,
    description: m.admin.meta.customReportBuilder.description
  }
}

export default async function AdminCustomReportBuilderPage() {
  await requireAdminOrRedirect()
  return <AdminCustomReportClient />
}
