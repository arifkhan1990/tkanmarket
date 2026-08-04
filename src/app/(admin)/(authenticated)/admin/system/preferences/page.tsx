import type { Metadata } from 'next'

import { AdminSystemPreferencesClient } from '@/components/admin/system-console/admin-system-preferences-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'System preferences | TkanMarket Admin',
    description: 'Regional currency, timezone, taxes, and SKU logic.'
  }
}

export default async function AdminSystemPreferencesPage() {
  await requireAdminOrRedirect()
  return <AdminSystemPreferencesClient />
}
