import type { Metadata } from 'next'

import { AdminAccessClient } from '@/components/admin/access/AdminAccessClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.access.title,
    description: m.admin.meta.access.description
  }
}

export default function AdminAccessPage() {
  return <AdminAccessClient />
}
