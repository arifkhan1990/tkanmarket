import type { Metadata } from 'next'

import { AdminTeamsClient } from '@/components/admin/teams/AdminTeamsClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.teams.title,
    description: m.admin.meta.teams.description
  }
}

export default function AdminTeamsPage() {
  return <AdminTeamsClient />
}
