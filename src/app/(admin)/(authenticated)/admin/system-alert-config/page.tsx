import type { Metadata } from 'next'

import { AdminSystemAlertConfigClient } from '@/components/admin/system-alerts/admin-system-alert-config-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const m = getMessages(await getServerLocale())
  return {
    title: m.admin.meta.systemAlertConfig.title,
    description: m.admin.meta.systemAlertConfig.description
  }
}

/** Database-backed monitors, channels, and logs (`/api/v1/admin/system-alert-config`). */
export default async function AdminSystemAlertConfigPage() {
  await requireAdminOrRedirect()
  return <AdminSystemAlertConfigClient />
}
