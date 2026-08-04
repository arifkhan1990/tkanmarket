import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AdminSupplierWithdrawalsClient } from '@/components/admin/supplier-ops/admin-supplier-withdrawals-client'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

import AdminSuppliersLoading from '../loading'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.supplierSuite.withdrawalsPageTitle} | TkanMarket Admin`,
    description: m.admin.supplierSuite.withdrawalsPageSubtitle
  }
}

export default function AdminSupplierWithdrawalsPage() {
  return (
    <Suspense fallback={<AdminSuppliersLoading />}>
      <AdminSupplierWithdrawalsClient />
    </Suspense>
  )
}
