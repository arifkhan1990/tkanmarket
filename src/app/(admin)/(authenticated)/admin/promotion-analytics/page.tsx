import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'TkanMarket | Promotions hub',
  description: 'Promotion manager and analytics are now on a single page.'
}

export default function AdminPromotionAnalyticsPage() {
  permanentRedirect('/admin/promotion-manager')
}
