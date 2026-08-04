import type { Metadata } from 'next'

import { ForgotPasswordClient } from '@/components/public/auth/ForgotPasswordClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.authPublic.forgotTitle} | ${m.common.brand}`,
    description: m.authPublic.forgotDescription
  }
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
