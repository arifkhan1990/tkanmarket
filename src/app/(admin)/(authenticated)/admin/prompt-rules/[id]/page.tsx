import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { AdminPromptRulesClient } from '@/components/admin/prompt-rules/AdminPromptRulesClient'

export const metadata: Metadata = {
  title: 'Edit Prompt Rule - Admin',
  description: 'Edit a prompt rule'
}

export default async function AdminEditPromptRulePage() {
  await requireAdminOrRedirect()
  return <AdminPromptRulesClient />
}
