import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { AdminBlogClient } from '@/components/admin/blog/admin-blog-client'

export const metadata: Metadata = {
  title: 'Blog | TkanMarket',
  description: 'Manage blog posts',
}

export default async function AdminBlogPage() {
  await requireAdminOrRedirect()
  return <AdminBlogClient />
}
