import type { Metadata } from 'next'
import { Suspense } from 'react'

import { InviteAcceptClient } from '@/components/public/auth/InviteAcceptClient'
import { PublicAuthFormSkeleton } from '@/components/public/auth/public-auth-skeleton'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

/** Token in query string; avoid static prerender. */
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.authPublic.inviteTitle} | ${m.common.brand}`,
    description: m.authPublic.inviteSubtitle
  }
}

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={<PublicAuthFormSkeleton fields={2} />}>
      <InviteAcceptClient />
    </Suspense>
  )
}
