import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { SocialCalendarClient } from '@/components/admin/social/social-calendar-client'

export const metadata: Metadata = {
  title: 'Content calendar',
  description: 'Monthly calendar view of scheduled and published social posts.'
}

export default async function AdminSocialCalendarPage() {
  await requireAdminOrRedirect()
  return <SocialCalendarClient />
}
