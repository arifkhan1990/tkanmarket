import type { Metadata } from 'next'

import { AdminGlobalShippingLogisticsClient } from '@/components/admin/logistics/AdminGlobalShippingLogisticsClient'

export const metadata: Metadata = {
  title: 'Global shipping & logistics | TkanMarket Admin',
  description: 'Track fabric sample shipments and transit status across corridors.'
}

export default function AdminGlobalShippingLogisticsPage() {
  return <AdminGlobalShippingLogisticsClient />
}
