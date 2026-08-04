import type { Metadata } from 'next'

import { AdminBulkOrderManagementClient } from '@/components/admin/bulk-orders/AdminBulkOrderManagementClient'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Bulk Order Management | TkanMarket Admin',
    description: 'Manage high-volume fabric orders and fulfillment status.'
  }
}

export default function AdminBulkOrderManagementPage() {
  return <AdminBulkOrderManagementClient />
}
