import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { FabricDetail } from '@/types/marketplace.types'

export async function fetchFabricsForCompare(ids: number[]): Promise<FabricDetail[]> {
  if (ids.length === 0) return []
  const params = new URLSearchParams()
  params.set('ids', ids.join(','))
  const res = await fetch(`/api/v1/fabrics/compare?${params.toString()}`)
  const json = (await res.json()) as ApiEnvelope<FabricDetail[]>
  if (!res.ok) {
    if (!json.success) throw new Error(json.error.message)
    throw new Error('Request failed')
  }
  if (!json.success) throw new Error(json.error.message)
  return json.data
}
