import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { DataMigrationMappingResponse } from '@/types/admin-data-migration-mapping.types'

export async function fetchAdminDataMigrationMapping(): Promise<DataMigrationMappingResponse> {
  const res = await fetch('/api/v1/admin/data-migration/mapping')
  const json = (await res.json()) as ApiEnvelope<DataMigrationMappingResponse>
  if (!res.ok || !json.success) {
    const msg = !json.success ? json.error.message : 'Request failed'
    throw new Error(msg)
  }
  return json.data
}
