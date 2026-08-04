import type { Metadata } from 'next'

import { SampleInventoryClient } from '@/components/admin/sample-inventory/sample-inventory-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.sampleInventory.title,
    description: m.admin.meta.sampleInventory.description
  }
}

export default async function AdminSampleInventoryPage() {
  await requireAdminOrRedirect()
  return <SampleInventoryClient />
}
