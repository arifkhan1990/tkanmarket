import type { Metadata } from 'next'

import { AdminProductAttributesClient } from '@/components/admin/marketplace-suite/AdminProductAttributesClient'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.productAttributesOverview.title,
    description: m.admin.meta.productAttributesOverview.description
  }
}

export default async function ProductAttributesPage() {
  await requireAdminOrRedirect()
  return <AdminProductAttributesClient />
}
