import type { Metadata } from 'next'

import { FabricCategoriesClient } from '@/components/admin/fabric-categories/fabric-categories-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Fabric categories',
    description: 'Manage fabric categories'
  }
}

export default async function AdminFabricCategoriesPage() {
  await requireAdminOrRedirect()
  return <FabricCategoriesClient />
}

