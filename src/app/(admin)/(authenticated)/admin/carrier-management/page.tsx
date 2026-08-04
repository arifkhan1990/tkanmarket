import type { Metadata } from 'next'

import { AdminCarrierManagementClient } from '@/components/admin/logistics/AdminCarrierManagementClient'

export const metadata: Metadata = {
  title: 'Carrier Management | TkanMarket Admin',
  description: 'Manage carrier partners, service health, and lane performance.'
}

export default function AdminCarrierManagementPage() {
  return <AdminCarrierManagementClient />
}
