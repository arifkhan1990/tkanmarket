import { redirect } from 'next/navigation'

export default async function LeadLegacyAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/admin/leads/${encodeURIComponent(id)}`)
}

