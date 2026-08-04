import type { Metadata } from 'next'

import { AdminBulkInquiriesClient } from '@/components/admin/bulk-inquiries/AdminBulkInquiriesClient'

export const metadata: Metadata = {
  title: 'TkanMarket | Bulk Inquiries',
  description: 'Create and manage bulk procurement inquiries.'
}

export default function BulkInquiriesPage() {
  return <AdminBulkInquiriesClient />
}

