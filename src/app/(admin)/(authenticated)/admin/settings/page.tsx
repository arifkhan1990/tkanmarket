import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { AdminSettingsClient } from '@/components/admin/AdminSettingsClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.settings.title,
    description: m.admin.meta.settings.description,
  }
}

export default async function AdminSettingsPage() {
  await requireAdminOrRedirect()
  return <AdminSettingsClient />
}

