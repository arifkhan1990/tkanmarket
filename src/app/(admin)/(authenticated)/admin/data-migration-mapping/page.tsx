import type { Metadata } from 'next'

import { AdminDataMigrationMappingClient } from '@/components/admin/data-migration/AdminDataMigrationMappingClient'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.dataMigrationMapping.title,
    description: m.admin.meta.dataMigrationMapping.description
  }
}

export default async function AdminDataMigrationMappingPage() {
  await requireAdminOrRedirect()
  return <AdminDataMigrationMappingClient />
}
