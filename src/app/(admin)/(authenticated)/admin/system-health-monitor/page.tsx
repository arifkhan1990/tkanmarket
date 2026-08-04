import type { Metadata } from 'next'

import { AdminSystemHealthMonitorClient } from '@/components/admin/system-health/AdminSystemHealthMonitorClient'

export const metadata: Metadata = {
  title: 'TkanMarket | System Health Monitor',
  description: 'Admin dashboard for system uptime, security alerts, and crawler health.'
}

export default function AdminSystemHealthMonitorPage() {
  return <AdminSystemHealthMonitorClient />
}

