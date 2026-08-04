import type { Metadata } from 'next'

import { AdminTotpClient } from '@/components/admin/security/AdminTotpClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.totp.title,
    description: m.admin.meta.totp.description
  }
}

export default function AdminTotpPage() {
  return <AdminTotpClient />
}
