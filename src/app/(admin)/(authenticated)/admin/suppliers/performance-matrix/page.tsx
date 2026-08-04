import type { Metadata } from 'next'

import { AdminSupplierPerformanceMatrixClient } from '@/components/admin/suppliers/admin-supplier-performance-matrix-client'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.supplierSuite.performanceTitle} | TkanMarket Admin`,
    description: m.admin.supplierSuite.performanceSubtitle
  }
}

export default function AdminSupplierPerformanceMatrixPage() {
  return <AdminSupplierPerformanceMatrixClient />
}
