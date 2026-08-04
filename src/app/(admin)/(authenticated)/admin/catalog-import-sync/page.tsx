import type { Metadata } from 'next'

import { AdminBulkDataFieldMappingClient } from '@/components/admin/bulk-data/AdminBulkDataFieldMappingClient'

export const metadata: Metadata = {
  title: 'TkanMarket | Catalog Import Manager',
  description: 'Map supplier feeds to the catalog schema and monitor import jobs.'
}

export default function CatalogImportSyncPage() {
  return <AdminBulkDataFieldMappingClient />
}
