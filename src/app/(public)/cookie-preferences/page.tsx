import type { Metadata } from 'next'

import { CookiePreferencesClient } from '@/components/public/CookiePreferencesClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const p = m.admin.cookiePreferencesPage
  return {
    title: `${p.title} | ${m.common.brand}`,
    description: p.subtitle
  }
}

export default function CookiePreferencesPage() {
  return <CookiePreferencesClient />
}
