import type { Metadata } from 'next'

import { AdminApiKeysClient } from '@/components/admin/api-keys/AdminApiKeysClient'

export const metadata: Metadata = {
  title: 'TkanMarket | API Keys & Integrations',
  description: 'Admin view for API access keys and crawler integrations.'
}

export default function AdminApiKeysPage() {
  return <AdminApiKeysClient />
}

