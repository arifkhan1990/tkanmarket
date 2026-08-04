import type { Metadata } from 'next'

import { SampleRequestFormClient } from '@/components/public/sample-request-form-client'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Uses `headers()` / `cookies()` via getServerLocale — must not be statically prerendered. */
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.leads.sampleDedicated.metaTitle,
    description: m.leads.sampleDedicated.metaDescription
  }
}

export default async function SampleRequestPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const raw = sp.fabric_id
  const fabricIdRaw = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined
  const parsed = fabricIdRaw ? Number.parseInt(fabricIdRaw, 10) : Number.NaN
  const initialFabricId = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined

  return (
    <PublicPageShell className="pb-16 pt-8" blur="sm">
      <SampleRequestFormClient initialFabricId={initialFabricId} />
    </PublicPageShell>
  )
}
