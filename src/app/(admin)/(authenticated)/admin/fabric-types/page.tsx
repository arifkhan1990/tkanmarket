import type { Metadata } from 'next'

import { FabricTypesClient } from '@/components/admin/fabric-types/fabric-types-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Fabric Types',
    description: 'Manage fabric types'
  }
}

export default function AdminFabricTypesPage() {
  return <FabricTypesClient />
}
