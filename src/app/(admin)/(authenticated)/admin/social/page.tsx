import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { AdminSocialClient } from '@/components/admin/AdminSocialClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.social.title,
    description: m.admin.meta.social.description,
  }
}

export default async function AdminSocialPage() {
  await requireAdminOrRedirect()
  return <AdminSocialClient />
}

