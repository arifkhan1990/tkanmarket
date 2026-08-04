import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.supplierSuite.withdrawalsPageTitle} | TkanMarket Admin`,
    description: m.admin.supplierSuite.withdrawalsPageSubtitle
  }
}

/** Legacy sidebar URL — canonical withdrawals UI is `/admin/suppliers/withdrawals`. */
export default function AdminSupplierWithdrawalsLegacyRedirectPage() {
  redirect('/admin/suppliers/withdrawals')
}
