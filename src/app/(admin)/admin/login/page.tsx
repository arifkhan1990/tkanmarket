import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AdminLoginClient } from '@/components/admin/AdminLoginClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.login.title,
    description: m.admin.meta.login.description,
  }
}

export default async function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-background" aria-hidden />}>
      <AdminLoginClient />
    </Suspense>
  )
}

