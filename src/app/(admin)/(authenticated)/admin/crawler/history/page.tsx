import type { Metadata } from 'next'

import { AdminCrawlerHistoryClient } from '@/components/admin/crawler/AdminCrawlerHistoryClient'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.crawlerHistory.title} | TkanMarket`,
    description: m.admin.crawlerHistory.subtitle,
  }
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminCrawlerHistoryPage({ searchParams }: PageProps) {
  await requireAdminOrRedirect()
  const sp = await searchParams
  const raw = sp.q
  const initialQ = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined
  return <AdminCrawlerHistoryClient initialQuery={initialQ} />
}
