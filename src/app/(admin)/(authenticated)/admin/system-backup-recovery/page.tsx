import type { Metadata } from 'next'

import { AdminSystemBackupClient } from '@/components/admin/system-backup/admin-system-backup-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { unstable_noStore as noStore } from 'next/cache'

export const metadata: Metadata = {
  title: 'System Backup & Recovery | TkanMarket Admin',
  description: 'Operational snapshots, storage targets, and recovery protocols.'
}

export default async function AdminSystemBackupRecoveryPage() {
  noStore()
  await requireAdminOrRedirect()
  return <AdminSystemBackupClient />
}
