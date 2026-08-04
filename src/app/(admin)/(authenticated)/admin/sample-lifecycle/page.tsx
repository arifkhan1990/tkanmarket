import type { Metadata } from 'next'

import { SampleLifecycleClient } from '@/components/admin/sample-lifecycle/sample-lifecycle-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.sampleLifecycle.title,
    description: m.admin.meta.sampleLifecycle.description
  }
}

export default async function AdminSampleLifecyclePage() {
  await requireAdminOrRedirect()
  return <SampleLifecycleClient />
}
