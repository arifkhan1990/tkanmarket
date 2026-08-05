import type { Metadata } from 'next'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import FabricContentClient from '@/components/admin/social/fabric-content-client'

export const metadata: Metadata = {
  title: 'Fabric content — TkanMarket Admin',
  description: 'All social media posts for a fabric'
}

export default async function FabricContentPage({ params }: { params: Promise<{ fabricId: string }> }) {
  await requireAdminOrRedirect()
  const { fabricId } = await params
  const id = Number(fabricId)
  if (!Number.isInteger(id) || id <= 0) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">Invalid fabric id</div>
  }
  return <FabricContentClient fabricId={id} />
}
