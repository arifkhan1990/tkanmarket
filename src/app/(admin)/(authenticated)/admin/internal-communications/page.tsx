import type { Metadata } from 'next'

import { AdminInternalCommunicationsClient } from '@/components/admin/inventory-suite/admin-internal-communications-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.internalCommunications.title,
    description: m.admin.meta.internalCommunications.description
  }
}

export default async function AdminInternalCommunicationsPage() {
  await requireAdminOrRedirect()
  return <AdminInternalCommunicationsClient />
}
