import type { Metadata } from 'next'

import { AdminPromotionHubClient } from '@/components/admin/promotion-hub/admin-promotion-hub-client'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.promotionHub.title,
    description: m.admin.meta.promotionHub.description
  }
}

export default function PromotionManagerPage() {
  return <AdminPromotionHubClient />
}
