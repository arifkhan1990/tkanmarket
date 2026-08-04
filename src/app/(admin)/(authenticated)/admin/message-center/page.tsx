import type { Metadata } from 'next'

import { AdminMessageCenterClient } from '@/components/admin/marketplace-suite/AdminMessageCenterClient'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.messageCenter.title,
    description: m.admin.meta.messageCenter.description
  }
}

export default async function MessageCenterPage() {
  await requireAdminOrRedirect()
  return <AdminMessageCenterClient />
}
