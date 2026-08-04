import type { Metadata } from 'next'

import { PublicMaintenanceClient } from '@/components/public/public-maintenance-client'

export const metadata: Metadata = {
  title: 'Maintenance | TkanMarket',
  description: 'Scheduled maintenance and platform status.'
}

export default function MaintenancePage() {
  return <PublicMaintenanceClient />
}
