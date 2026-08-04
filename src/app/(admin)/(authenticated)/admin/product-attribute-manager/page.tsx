import type { Metadata } from 'next'

import { ProductAttributeManagerClient } from '@/components/admin/product-attribute-manager/product-attribute-manager-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.productAttributeManager.title,
    description: m.admin.meta.productAttributeManager.description
  }
}

export default async function AdminProductAttributeManagerPage() {
  await requireAdminOrRedirect()
  return <ProductAttributeManagerClient />
}
