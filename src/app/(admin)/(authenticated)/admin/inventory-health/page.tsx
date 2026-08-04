import type { Metadata } from 'next'

import { AdminInventoryHealthClient } from '@/components/admin/inventory-suite/admin-inventory-health-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.inventoryHealth.title,
    description: m.admin.meta.inventoryHealth.description
  }
}

export default async function AdminInventoryHealthPage() {
  await requireAdminOrRedirect()
  return <AdminInventoryHealthClient />
}
