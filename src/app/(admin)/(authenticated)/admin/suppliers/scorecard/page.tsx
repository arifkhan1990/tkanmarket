import type { Metadata } from 'next'

import { AdminSupplierScorecardClient } from '@/components/admin/suppliers/admin-supplier-scorecard-client'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.supplierSuite.scorecardTitle} | TkanMarket Admin`,
    description: m.admin.supplierSuite.scorecardSubtitle
  }
}

export default function AdminSupplierScorecardPage() {
  return <AdminSupplierScorecardClient variant="executive" />
}
