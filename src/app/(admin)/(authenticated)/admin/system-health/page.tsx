import type { Metadata } from 'next'

import { AdminSystemHealthDashboardClient } from '@/components/admin/system-health/admin-system-health-dashboard-client'

export const metadata: Metadata = {
  title: 'TkanMarket | System Health',
  description: 'Real-time infrastructure observability for the TkanMarket platform.'
}

export default function SystemHealthPage() {
  return <AdminSystemHealthDashboardClient />
}

