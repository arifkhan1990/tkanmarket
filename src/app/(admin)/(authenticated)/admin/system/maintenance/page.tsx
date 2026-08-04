import type { Metadata } from 'next'

import { AdminSystemMaintenanceClient } from '@/components/admin/system-console/admin-system-maintenance-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Maintenance | TkanMarket Admin',
    description: 'Configure public maintenance mode and messaging.'
  }
}

export default async function AdminSystemMaintenancePage() {
  await requireAdminOrRedirect()
  return <AdminSystemMaintenanceClient />
}
