import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AdminSupplierDiscoveryRunDetailClient } from '@/components/admin/supplier-discovery/admin-supplier-discovery-run-detail-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'

type Props = { params: Promise<{ runId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { runId } = await params
  return {
    title: `Supplier discovery #${runId} | TkanMarket Admin`,
    description: 'Review supplier discovery run, drafts, and ingest approved suppliers.'
  }
}

export default async function AdminSupplierDiscoveryRunPage({ params }: Props) {
  await requireAdminOrRedirect()
  const { runId } = await params
  const id = Number(runId)
  if (!Number.isInteger(id) || id < 1) notFound()
  return <AdminSupplierDiscoveryRunDetailClient runId={id} />
}
