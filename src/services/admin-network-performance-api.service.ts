import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { NetworkPerformanceResponse } from '@/types/admin-network-performance.types'

export async function fetchNetworkPerformance(): Promise<ApiEnvelope<NetworkPerformanceResponse>> {
  const res = await fetch('/api/v1/admin/network-performance')
  return (await res.json()) as ApiEnvelope<NetworkPerformanceResponse>
}
