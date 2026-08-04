import { redirect } from 'next/navigation'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'

export default async function AdminCrawlerIndexPage() {
  await requireAdminOrRedirect()
  redirect('/admin/crawler/control')
}
