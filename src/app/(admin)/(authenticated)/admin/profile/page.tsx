import type { Metadata } from 'next'

import { AdminProfileClient } from '@/components/admin/profile/AdminProfileClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.profile.title,
    description: m.admin.meta.profile.description
  }
}

export default function AdminProfilePage() {
  return <AdminProfileClient />
}
