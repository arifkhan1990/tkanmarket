import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { SocialIntegrationsClient } from '@/components/admin/social/social-integrations-client'

export const metadata: Metadata = {
  title: 'Social integrations',
  description: 'Connect and manage social media accounts for publishing.'
}

export default async function AdminSocialIntegrationsPage() {
  await requireAdminOrRedirect()
  return <SocialIntegrationsClient />
}
