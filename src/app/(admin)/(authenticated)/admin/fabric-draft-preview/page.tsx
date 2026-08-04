import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AdminFabricDraftPreviewClient } from '@/components/admin/fabric-draft/AdminFabricDraftPreviewClient'
import { FabricDraftPreviewSkeleton } from '@/components/admin/fabric-draft/fabric-draft-preview-skeleton'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.fabricDraftPreview.title,
    description: m.admin.meta.fabricDraftPreview.description
  }
}

export default async function AdminFabricDraftPreviewPage() {
  await requireAdminOrRedirect()
  const locale = await getServerLocale()
  return (
    <Suspense fallback={<FabricDraftPreviewSkeleton />}>
      <AdminFabricDraftPreviewClient locale={locale} />
    </Suspense>
  )
}
