import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { SocialAnalyticsClient } from '@/components/admin/social/social-analytics-client'

export const metadata: Metadata = {
  title: 'Social analytics',
  description: 'Cross-platform performance for published social content.'
}

export default async function AdminSocialAnalyticsPage() {
  await requireAdminOrRedirect()
  return <SocialAnalyticsClient />
}
