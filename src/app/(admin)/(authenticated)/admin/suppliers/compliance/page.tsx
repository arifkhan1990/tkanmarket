import type { Metadata } from 'next'

import { SupplierComplianceClient } from '@/components/admin/suppliers/SupplierComplianceClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.supplierCompliancePage.title} | TkanMarket Admin`,
    description: m.admin.supplierCompliancePage.subtitle
  }
}

export default function AdminSupplierCompliancePage() {
  return <SupplierComplianceClient />
}
