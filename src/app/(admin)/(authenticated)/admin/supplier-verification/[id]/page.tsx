import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AdminSupplierVerificationDetailClient } from '@/components/admin/supplier-ops/admin-supplier-verification-detail-client'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const p = await params
  return {
    title: `${m.admin.supplierSuite.verificationDetailTitle} #${p.id} | TkanMarket Admin`,
    description: m.admin.supplierSuite.verificationPageSubtitle
  }
}

export default async function AdminSupplierVerificationDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const p = await params
  const id = Number.parseInt(p.id, 10)
  if (!Number.isFinite(id) || id <= 0) notFound()
  return <AdminSupplierVerificationDetailClient caseId={id} />
}
