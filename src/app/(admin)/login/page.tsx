import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.login.title,
    description: m.admin.meta.login.description,
  }
}

export default function AdminLoginAliasPage() {
  redirect('/admin/login')
}

