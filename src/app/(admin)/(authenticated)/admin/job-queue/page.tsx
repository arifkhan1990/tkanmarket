import type { Metadata } from 'next'

import { AdminJobQueueMonitorClient } from '@/components/admin/job-queue/AdminJobQueueMonitorClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const jq = m.admin.jobQueue
  return {
    title: `${jq.title} | TkanMarket`,
    description: jq.subtitle
  }
}

export default function AdminJobQueuePage() {
  return <AdminJobQueueMonitorClient />
}
