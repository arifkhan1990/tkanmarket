import type { Metadata } from 'next'
import { Suspense } from 'react'

import { ResetPasswordClient } from '@/components/public/auth/ResetPasswordClient'
import { PublicAuthFormSkeleton } from '@/components/public/auth/public-auth-skeleton'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.authPublic.resetTitle} | ${m.common.brand}`,
    description: m.authPublic.resetDescription
  }
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PublicAuthFormSkeleton fields={1} />}>
      <ResetPasswordClient />
    </Suspense>
  )
}
