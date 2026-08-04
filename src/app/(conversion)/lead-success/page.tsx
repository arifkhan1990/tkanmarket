import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Suspense } from 'react'

import { LeadSuccessClient } from '@/components/public/lead-success-client'
import { decodeLeadSuccessCookieValue, LEAD_SUCCESS_COOKIE_NAME } from '@/lib/lead-success-cookie'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

/** Reads/writes cookies; must not be statically prerendered. */
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.leads.successPage.pageTitle} | ${m.common.brand}`,
    description: m.leads.successPage.body.replace('{hours}', '4'),
    robots: { index: false, follow: true }
  }
}

export default async function LeadSuccessPage() {
  const jar = await cookies()
  const raw = jar.get(LEAD_SUCCESS_COOKIE_NAME)?.value
  let initialContactFromCookie: string | null = null
  if (raw) {
    initialContactFromCookie = decodeLeadSuccessCookieValue(raw)
    jar.delete(LEAD_SUCCESS_COOKIE_NAME)
  }

  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-[50vh] flex-col items-center justify-center px-6 py-24">
          <div className="bg-surface-container-high h-48 w-48 animate-pulse rounded-xl md:h-64 md:w-64" />
          <div className="bg-surface-container-high mt-10 h-10 w-64 max-w-full animate-pulse rounded-lg" />
          <div className="bg-surface-container-high mt-4 h-6 w-full max-w-xl animate-pulse rounded-lg" />
        </div>
      }
    >
      <LeadSuccessClient initialContactFromCookie={initialContactFromCookie} />
    </Suspense>
  )
}
