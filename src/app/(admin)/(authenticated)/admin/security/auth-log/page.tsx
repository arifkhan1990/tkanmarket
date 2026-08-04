import type { Metadata } from 'next'

import { AdminSecurityAuthLogClient } from '@/components/admin/auth/AdminSecurityAuthLogClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.securityAuthLog.title,
    description: m.admin.meta.securityAuthLog.description
  }
}

export default function AdminSecurityAuthLogPage() {
  return <AdminSecurityAuthLogClient />
}
