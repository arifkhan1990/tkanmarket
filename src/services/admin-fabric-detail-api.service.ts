import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminFabricDetail } from '@/types/admin-fabric-management.types'

export async function fetchAdminFabricDetail(id: number): Promise<ApiEnvelope<AdminFabricDetail>> {
  const res = await fetch(`/api/v1/admin/fabrics/${id}`)
  return (await res.json()) as ApiEnvelope<AdminFabricDetail>
}
