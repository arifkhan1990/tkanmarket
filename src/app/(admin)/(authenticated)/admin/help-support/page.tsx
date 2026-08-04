import type { Metadata } from 'next'

import { AdminHelpSupportCenterClient } from '@/components/admin/help/AdminHelpSupportCenterClient'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { unstable_noStore as noStore } from 'next/cache'

export const metadata: Metadata = {
  title: 'Help & support | TkanMarket Admin',
  description: 'Internal SOPs, troubleshooting, and support tickets for the operations team.'
}

export default async function AdminHelpSupportPage() {
  noStore()
  await requireAdminOrRedirect()
  return <AdminHelpSupportCenterClient />
}
