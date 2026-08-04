import type { Metadata } from 'next'

import { AdminCrawlerControlClient } from '@/components/admin/crawler/AdminCrawlerControlClient'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.crawlerPage.title} | TkanMarket`,
    description: m.admin.meta.crawler.description,
  }
}

export default async function AdminCrawlerControlPage() {
  await requireAdminOrRedirect()
  return <AdminCrawlerControlClient />
}
