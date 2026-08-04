import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AdminSupplierReviewsClient } from '@/components/admin/supplier-ops/admin-supplier-reviews-client'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

import AdminSuppliersLoading from '../suppliers/loading'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.supplierSuite.reviewsPageTitle} | TkanMarket Admin`,
    description: m.admin.supplierSuite.reviewsPageSubtitle
  }
}

export default function AdminSupplierReviewsPage() {
  return (
    <Suspense fallback={<AdminSuppliersLoading />}>
      <AdminSupplierReviewsClient />
    </Suspense>
  )
}
