import type { Metadata } from 'next'

import { AdminTechnicalDiagnosticsClient } from '@/components/admin/technical-diagnostics/admin-technical-diagnostics-client'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.technicalDiagnostics.title,
    description: m.admin.meta.technicalDiagnostics.description
  }
}

export default function AdminTechnicalDiagnosticsPage() {
  return <AdminTechnicalDiagnosticsClient />
}
