import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { LeadAssignmentRulesClient } from '@/components/admin/leads/lead-assignment-rules-client'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.leadAssignmentPage.title} | ${m.common.brand}`,
    description: m.admin.leadAssignmentPage.subtitle
  }
}

export default async function AdminLeadAssignmentRulesPage() {
  await requireAdminOrRedirect()
  return <LeadAssignmentRulesClient />
}
