import type { Metadata } from 'next'

import { AdminSecuritySettingsClient } from '@/components/admin/security/AdminSecuritySettingsClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.securitySettings.title,
    description: m.admin.meta.securitySettings.description
  }
}

export default function AdminSecuritySettingsPage() {
  return <AdminSecuritySettingsClient />
}
