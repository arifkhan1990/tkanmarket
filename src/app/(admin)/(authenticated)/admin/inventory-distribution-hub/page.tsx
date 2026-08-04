import type { Metadata } from 'next'

import { AdminInventoryDistributionHubClient } from '@/components/admin/inventory-suite/admin-inventory-distribution-hub-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.inventoryDistributionHub.title,
    description: m.admin.meta.inventoryDistributionHub.description
  }
}

export default async function AdminInventoryDistributionHubPage() {
  await requireAdminOrRedirect()
  return <AdminInventoryDistributionHubClient />
}
