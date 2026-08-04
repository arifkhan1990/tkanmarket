import type { Metadata } from 'next'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { notFound } from 'next/navigation'

import { LeadService } from '@/services/lead.service'
import { LeadDetailClient } from '@/components/admin/lead-detail/LeadDetailClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.leadDetail.title,
    description: m.admin.meta.leadDetail.description,
  }
}

export default async function AdminLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminOrRedirect()
  const p = await params
  const id = Number(p.id)
  if (!Number.isFinite(id) || id <= 0) notFound()
  const detail = await LeadService.getById(id)
  if (!detail) notFound()
  return <LeadDetailClient initial={detail} />
}

