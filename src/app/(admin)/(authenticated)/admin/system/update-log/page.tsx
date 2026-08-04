import type { Metadata } from 'next'

import { AdminSystemUpdateLogClient } from '@/components/admin/system-console/admin-system-update-log-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'System update log | TkanMarket Admin',
    description: 'Release notes and platform changelog.'
  }
}

export default async function AdminSystemUpdateLogPage() {
  await requireAdminOrRedirect()
  return <AdminSystemUpdateLogClient />
}
