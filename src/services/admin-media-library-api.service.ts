import type { ApiEnvelope } from '@/types/api-envelope.types'
import type {
  MediaLibraryResponse,
  MediaLibrarySort,
  MediaLibraryStatusFilter
} from '@/types/admin-media-library.types'

export interface FetchMediaLibraryParams {
  page: number
  limit: number
  q?: string
  folder?: string
  fabricId?: number
  status?: MediaLibraryStatusFilter
  sort?: MediaLibrarySort
}

export async function fetchMediaLibrary(
  params: FetchMediaLibraryParams
): Promise<ApiEnvelope<MediaLibraryResponse>> {
  const sp = new URLSearchParams()
  sp.set('page', String(params.page))
  sp.set('limit', String(params.limit))
  if (params.q) sp.set('q', params.q)
  if (params.folder) sp.set('folder', params.folder)
  if (params.fabricId) sp.set('fabricId', String(params.fabricId))
  if (params.status && params.status !== 'all') sp.set('status', params.status)
  if (params.sort && params.sort !== 'recent') sp.set('sort', params.sort)
  const res = await fetch(`/api/v1/admin/media-library?${sp.toString()}`, {
    cache: 'no-store',
    credentials: 'same-origin'
  })
  return (await res.json()) as ApiEnvelope<MediaLibraryResponse>
}
