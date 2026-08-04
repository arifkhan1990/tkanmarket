import type { Metadata } from 'next'

import { AdminBulkSeoEditorClient } from '@/components/admin/catalog/AdminBulkSeoEditorClient'

export const metadata: Metadata = {
  title: 'Bulk SEO Editor | TkanMarket Admin',
  description: 'Edit meta titles, descriptions, and alt tags for fabrics in bulk.'
}

export default function AdminBulkSeoEditorPage() {
  return <AdminBulkSeoEditorClient />
}
