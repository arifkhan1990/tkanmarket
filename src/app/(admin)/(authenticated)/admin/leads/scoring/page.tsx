import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { LeadScoringSuiteClient } from '@/components/admin/leads/lead-scoring-suite-client'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.leadScoringPage.title} | ${m.common.brand}`,
    description: m.admin.leadScoringPage.subtitle
  }
}

export default async function AdminLeadScoringPage() {
  await requireAdminOrRedirect()
  return <LeadScoringSuiteClient initialTab="overview" />
}
