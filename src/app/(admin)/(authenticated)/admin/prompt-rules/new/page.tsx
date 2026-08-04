import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { AdminPromptRulesClient } from '@/components/admin/prompt-rules/AdminPromptRulesClient'

export const metadata: Metadata = {
  title: 'New Prompt Rule - Admin',
  description: 'Create a new prompt rule'
}

export default async function AdminNewPromptRulePage() {
  await requireAdminOrRedirect()
  return <AdminPromptRulesClient />
}
