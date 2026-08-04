import type { Metadata } from 'next'
import Link from 'next/link'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { AdminFabricBulkCreateClient } from '@/components/admin/admin-fabric-bulk-create-client'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: `${m.admin.fabrics.bulkCreatePageTitle} | TkanMarket`,
    description: m.admin.fabrics.bulkCreatePageSubtitle
  }
}

export default async function AdminFabricBulkCreatePage() {
  await requireAdminOrRedirect()
  const locale = await getServerLocale()
  const messages = getMessages(locale)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-outline">
          <span>{messages.breadcrumbs.catalog}</span>
          <span aria-hidden className="text-outline/60">
            /
          </span>
          <Link className="text-outline hover:text-on-surface" href="/admin/fabrics">
            {messages.admin.fabricsModerationPage.title}
          </Link>
          <span aria-hidden className="text-outline/60">
            /
          </span>
          <span className="font-semibold text-primary">{messages.admin.fabrics.bulkCreatePageTitle}</span>
        </nav>
      </div>
      <AdminFabricBulkCreateClient />
    </div>
  )
}
