import type { Metadata } from 'next'

import { AdminCatalogExportClient } from '@/components/admin/catalog/AdminCatalogExportClient'

export const metadata: Metadata = {
  title: 'System Export Configurator | TkanMarket Admin',
  description: 'Map catalog fields and preview export payloads before running jobs.'
}

export default function AdminExportConfiguratorPage() {
  return <AdminCatalogExportClient variant="configurator" />
}
