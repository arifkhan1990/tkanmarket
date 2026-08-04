import type { Metadata } from 'next'

import { AdminAiPromptLogsClient } from '@/components/admin/ai-prompts/AdminAiPromptLogsClient'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'AI Prompt Logs | TkanMarket Admin',
    description: 'Track LLM prompt executions, tokens, costs, and responses.'
  }
}

export default async function AdminAiPromptLogsPage() {
  await requireAdminOrRedirect()
  return <AdminAiPromptLogsClient />
}
