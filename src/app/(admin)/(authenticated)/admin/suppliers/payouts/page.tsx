import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AdminSupplierPayoutsClient } from '@/components/admin/suppliers/admin-supplier-payouts-client'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

import AdminSuppliersLoading from '../loading'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.supplierSuite.payoutsTitle} | TkanMarket Admin`,
    description: m.admin.supplierSuite.payoutsSubtitle
  }
}

export default function AdminSupplierPayoutsPage() {
  return (
    <Suspense fallback={<AdminSuppliersLoading />}>
      <AdminSupplierPayoutsClient />
    </Suspense>
  )
}
