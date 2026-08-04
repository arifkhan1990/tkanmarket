import type { Metadata } from 'next'

import { AdminMarketplaceAnalyticsClient } from '@/components/admin/marketplace-suite/AdminMarketplaceAnalyticsClient'

export const metadata: Metadata = {
  title: 'TkanMarket | Marketplace analytics',
  description: 'Marketplace revenue, leads, and category performance with selectable periods.'
}

export default function MarketplaceAnalyticsPage() {
  return <AdminMarketplaceAnalyticsClient />
}
