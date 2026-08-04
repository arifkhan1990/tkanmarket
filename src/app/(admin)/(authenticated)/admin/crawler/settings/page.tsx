import type { Metadata } from 'next'

import { AdminCrawlerSettingsClient } from '@/components/admin/crawler/AdminCrawlerSettingsClient'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.crawlerSettingsPage.title} | TkanMarket`,
    description: m.admin.crawlerSettingsPage.subtitle,
  }
}

export default async function AdminCrawlerSettingsPage() {
  await requireAdminOrRedirect()
  return <AdminCrawlerSettingsClient />
}
