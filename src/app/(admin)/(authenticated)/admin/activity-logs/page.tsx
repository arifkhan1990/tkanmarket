import type { Metadata } from 'next'

import { UserActivityLogsClient } from '@/components/admin/user-activity-logs/UserActivityLogsClient'

export const metadata: Metadata = {
  title: 'TkanMarket | Activity Logs',
  description: 'Admin view of user-specific audit and security events.'
}

export default function UserActivityLogsPage() {
  return <UserActivityLogsClient />
}

