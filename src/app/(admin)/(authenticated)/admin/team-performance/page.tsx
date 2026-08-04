import type { Metadata } from 'next'

import { AdminTeamPerformanceClient } from '@/components/admin/teams/admin-team-performance-client'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.teamPerformance.title,
    description: m.admin.meta.teamPerformance.description
  }
}

export default function AdminTeamPerformancePage() {
  return <AdminTeamPerformanceClient />
}
