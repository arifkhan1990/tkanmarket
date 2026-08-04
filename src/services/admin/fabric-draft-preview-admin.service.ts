import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { FabricDraftPreviewResponse } from '@/types/admin-fabric-draft-preview.types'

export async function fetchAdminFabricDraftPreview(fabricId: number): Promise<FabricDraftPreviewResponse> {
  const res = await fetch(`/api/v1/admin/fabrics/${fabricId}/draft-preview`)
  const json = (await res.json()) as ApiEnvelope<FabricDraftPreviewResponse>
  if (!res.ok || !json.success) {
    const msg = !json.success ? json.error.message : 'Request failed'
    throw new Error(msg)
  }
  return json.data
}
