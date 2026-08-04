import type { Metadata } from 'next'

import { ProductReviewQueueClient } from '@/components/admin/product-review-queue/product-review-queue-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.productReviewQueue.title,
    description: m.admin.meta.productReviewQueue.description
  }
}

export default async function AdminProductReviewQueuePage() {
  await requireAdminOrRedirect()
  return <ProductReviewQueueClient />
}
