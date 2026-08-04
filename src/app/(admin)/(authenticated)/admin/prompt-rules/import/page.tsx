import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { AdminPromptRulesClient } from '@/components/admin/prompt-rules/AdminPromptRulesClient'

export const metadata: Metadata = {
  title: 'Import Prompt Rules - Admin',
  description: 'Import prompt rules from JSON'
}

export default async function AdminImportPromptRulesPage() {
  await requireAdminOrRedirect()
  return <AdminPromptRulesClient />
}
