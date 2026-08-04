import type { Metadata } from 'next'

import { AdminUserAccessManagementClient } from '@/components/admin/access/admin-user-access-management-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.userAccess.title,
    description: m.admin.meta.userAccess.description
  }
}

export default async function AdminUserAccessPage() {
  await requireAdminOrRedirect()
  return <AdminUserAccessManagementClient />
}
