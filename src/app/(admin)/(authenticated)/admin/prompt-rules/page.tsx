import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { AdminPromptRulesClient } from '@/components/admin/prompt-rules/AdminPromptRulesClient'

export const metadata: Metadata = {
  title: 'Prompt Rules - Admin',
  description: 'Manage AI prompt rules for image and video generation'
}

export default async function AdminPromptRulesPage() {
  await requireAdminOrRedirect()
  return <AdminPromptRulesClient />
}
