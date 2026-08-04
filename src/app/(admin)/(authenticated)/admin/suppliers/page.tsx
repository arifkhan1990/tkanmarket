import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AdminSuppliersClient } from '@/components/admin/suppliers/AdminSuppliersClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

import AdminSuppliersLoading from './loading'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.suppliersManagement.title} | TkanMarket Admin`,
    description: m.admin.suppliersManagement.subtitle
  }
}

export default function AdminSuppliersPage() {
  return (
    <Suspense fallback={<AdminSuppliersLoading />}>
      <AdminSuppliersClient />
    </Suspense>
  )
}
