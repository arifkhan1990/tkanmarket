import type { Metadata } from 'next'

import { AdminAlertsHubClient } from '@/components/admin/system-alerts/admin-alerts-hub-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'

export const metadata: Metadata = {
  title: 'TkanMarket | Notifications & alerts',
  description: 'Inbox, preferences, and system alert monitoring in one place.',
}

export default async function AdminAlertsHubPage() {
  await requireAdminOrRedirect()
  return <AdminAlertsHubClient />
}

