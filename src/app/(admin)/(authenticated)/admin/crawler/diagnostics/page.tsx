import type { Metadata } from 'next'

import { AdminCrawlerDiagnosticsClient } from '@/components/admin/crawler/AdminCrawlerDiagnosticsClient'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.crawlerDiagnostics.title} | TkanMarket`,
    description: m.admin.crawlerDiagnostics.subtitle,
  }
}

export default async function AdminCrawlerDiagnosticsPage() {
  await requireAdminOrRedirect()
  return <AdminCrawlerDiagnosticsClient />
}
