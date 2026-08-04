import type { Metadata } from 'next'

import { AdminSocialPreviewClient } from '@/components/admin/social/admin-social-preview-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.socialPreview.title,
    description: m.admin.meta.socialPreview.description
  }
}

export default async function AdminSocialPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminOrRedirect()
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const { id } = await params
  const postId = Number(id)
  if (!Number.isFinite(postId) || postId < 1) {
    return (
      <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-8 text-sm text-on-surface-variant">
        {m.common.somethingWentWrong}
      </div>
    )
  }
  return <AdminSocialPreviewClient postId={postId} />
}
