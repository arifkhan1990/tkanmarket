import type { Metadata } from 'next'

import { AdminSystemIntegrationsClient } from '@/components/admin/system-console/admin-system-integrations-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.systemIntegrations.title,
    description: m.admin.meta.systemIntegrations.description
  }
}

export default async function AdminSystemIntegrationsPage() {
  await requireAdminOrRedirect()
  return <AdminSystemIntegrationsClient />
}
