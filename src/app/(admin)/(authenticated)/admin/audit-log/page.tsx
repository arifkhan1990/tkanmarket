import type { Metadata } from 'next'

import { AdminAuditLogClient } from '@/components/admin/audit/AdminAuditLogClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.auditLog.title,
    description: m.admin.meta.auditLog.description
  }
}

export default function AdminAuditLogPage() {
  return <AdminAuditLogClient />
}
