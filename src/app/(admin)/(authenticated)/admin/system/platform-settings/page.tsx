import type { Metadata } from 'next'

import { AdminSystemPlatformSettingsClient } from '@/components/admin/system-console/admin-system-platform-settings-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Platform settings | TkanMarket Admin',
    description: 'General, security, and notification settings for the admin console.'
  }
}

export default async function AdminSystemPlatformSettingsPage() {
  await requireAdminOrRedirect()
  return <AdminSystemPlatformSettingsClient />
}
