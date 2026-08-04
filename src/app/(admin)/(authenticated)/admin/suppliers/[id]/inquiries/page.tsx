import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { SupplierInquiriesClient } from '@/components/admin/suppliers/SupplierInquiriesClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.supplierInquiriesPage.title} | TkanMarket Admin`,
    description: m.admin.supplierInquiriesPage.subtitle
  }
}

export default async function AdminSupplierInquiriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supplierId = Number(id)
  if (!Number.isFinite(supplierId) || supplierId < 1) {
    notFound()
  }
  return <SupplierInquiriesClient supplierId={supplierId} />
}
