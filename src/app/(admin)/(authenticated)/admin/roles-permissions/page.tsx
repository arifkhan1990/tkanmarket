import type { Metadata } from 'next'

import { RolesPermissionsClient } from '@/components/admin/roles-permissions/roles-permissions-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.rolesPermissions.title,
    description: m.admin.meta.rolesPermissions.description
  }
}

export default async function AdminRolesPermissionsPage() {
  await requireAdminOrRedirect()
  return <RolesPermissionsClient />
}
