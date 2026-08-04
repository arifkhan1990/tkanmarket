import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AdminSupplierVerificationListClient } from '@/components/admin/supplier-ops/admin-supplier-verification-list-client'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

import AdminSuppliersLoading from '../suppliers/loading'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.supplierSuite.verificationPageTitle} | TkanMarket Admin`,
    description: m.admin.supplierSuite.verificationPageSubtitle
  }
}

export default function AdminSupplierVerificationPage() {
  return (
    <Suspense fallback={<AdminSuppliersLoading />}>
      <AdminSupplierVerificationListClient />
    </Suspense>
  )
}
