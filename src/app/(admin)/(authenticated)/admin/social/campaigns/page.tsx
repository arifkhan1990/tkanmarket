import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { SocialCampaignsClient } from '@/components/admin/social/social-campaigns-client'

export const metadata: Metadata = {
  title: 'Social campaigns',
  description: 'Coordinate social media releases across platforms.'
}

export default async function AdminSocialCampaignsPage() {
  await requireAdminOrRedirect()
  return <SocialCampaignsClient />
}
