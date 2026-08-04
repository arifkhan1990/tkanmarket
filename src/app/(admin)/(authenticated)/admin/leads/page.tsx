import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { LeadCrmClient } from '@/app/(admin)/(authenticated)/admin/leads/lead-crm-client'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

interface AdminLeadsPageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.leads.title,
    description: m.admin.meta.leads.description,
  }
}

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  await requireAdminOrRedirect()

  const assignedParam = searchParams?.assigned
  const initialAssignedMode = Array.isArray(assignedParam) ? assignedParam[0] : assignedParam

  return <LeadCrmClient initialAssignedMode={initialAssignedMode === 'me' ? 'me' : 'all'} />
}

