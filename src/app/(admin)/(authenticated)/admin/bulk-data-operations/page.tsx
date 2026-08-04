import type { Metadata } from 'next'

import { AdminBulkDataOperationsClient } from '@/components/admin/bulk-data/AdminBulkDataOperationsClient'

export const metadata: Metadata = {
  title: 'TkanMarket | Bulk Data Operations',
  description: 'Monitor and manage high-volume catalog imports and bulk updates.'
}

export default function BulkDataOperationsPage() {
  return <AdminBulkDataOperationsClient />
}

