import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { AdminFabricService } from '@/services/admin-fabric.service'
import { FabricEditForm } from '@/components/admin/FabricEditForm'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.fabricDetail.title,
    description: m.admin.meta.fabricDetail.description,
  }
}

export default async function AdminFabricDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminOrRedirect()
  const { id } = await params
  const fabricId = Number(id)
  if (!Number.isFinite(fabricId) || fabricId <= 0) notFound()

  const fabric = await AdminFabricService.getById(fabricId)
  if (!fabric) notFound()

  return <FabricEditForm fabric={fabric} />
}

