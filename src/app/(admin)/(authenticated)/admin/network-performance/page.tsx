import type { Metadata } from 'next'

import { AdminNetworkPerformanceClient } from '@/components/admin/marketplace-suite/AdminNetworkPerformanceClient'

export const metadata: Metadata = {
  title: 'TkanMarket | Network performance',
  description: 'Queue health and crawler latency overview.'
}

export default function NetworkPerformancePage() {
  return <AdminNetworkPerformanceClient />
}
