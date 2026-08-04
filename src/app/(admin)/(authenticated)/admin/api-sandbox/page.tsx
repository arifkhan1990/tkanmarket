import type { Metadata } from 'next'

import { AdminApiSandboxClient } from '@/components/admin/api-sandbox/admin-api-sandbox-client'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.apiSandbox.title,
    description: m.admin.meta.apiSandbox.description
  }
}

export default function AdminApiSandboxPage() {
  return <AdminApiSandboxClient />
}
