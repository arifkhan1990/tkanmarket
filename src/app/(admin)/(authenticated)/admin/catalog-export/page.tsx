import type { Metadata } from 'next'

import { AdminCatalogExportClient } from '@/components/admin/catalog/AdminCatalogExportClient'

export const metadata: Metadata = {
  title: 'Catalog Export | TkanMarket Admin',
  description: 'Configure and generate high-volume fabric data exports.'
}

export default function AdminCatalogExportPage() {
  return <AdminCatalogExportClient />
}
