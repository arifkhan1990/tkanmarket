import type { Metadata } from 'next'

import { AdminSystemLogsClient } from '@/components/admin/system-console/admin-system-logs-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'System logs | TkanMarket Admin',
    description: 'Technical log stream with filters and analytics.'
  }
}

export default async function AdminSystemLogsPage() {
  await requireAdminOrRedirect()
  return <AdminSystemLogsClient />
}
