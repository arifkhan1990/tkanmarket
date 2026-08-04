import type { Metadata } from 'next'

import { AdminActivityTimelineClient } from '@/components/admin/activity-timeline/AdminActivityTimelineClient'

export const metadata: Metadata = {
  title: 'TkanMarket | System Activity',
  description: 'System timeline feed across leads, fabrics, audit, and security events.'
}

export default function AdminActivityTimelinePage() {
  return <AdminActivityTimelineClient />
}

