import type { Metadata } from 'next'

import { AdminInventoryHealthDistributionClient } from '@/components/admin/inventory-suite/admin-inventory-health-distribution-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.inventoryHealthDistribution.title,
    description: m.admin.meta.inventoryHealthDistribution.description
  }
}

export default async function AdminInventoryHealthDistributionPage() {
  await requireAdminOrRedirect()
  return <AdminInventoryHealthDistributionClient />
}
