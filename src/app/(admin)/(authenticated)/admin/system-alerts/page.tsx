import type { Metadata } from 'next'

import { AdminSystemAlertsClient } from '@/components/admin/system-alerts/AdminSystemAlertsClient'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const m = getMessages(await getServerLocale())
  return {
    title: m.admin.meta.systemAlerts.title,
    description: m.admin.meta.systemAlerts.description
  }
}

export default async function AdminSystemAlertsPage() {
  await requireAdminOrRedirect()
  return <AdminSystemAlertsClient />
}
