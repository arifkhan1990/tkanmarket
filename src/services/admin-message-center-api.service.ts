import type { ApiEnvelope } from '@/types/api-envelope.types'
import {
  MESSAGE_CENTER_STATUS_FILTER_ALL,
  type MessageCenterResponse
} from '@/types/admin-message-center.types'

export interface FetchMessageCenterParams {
  page: number
  limit: number
  q?: string
  source?: string
  status?: string
}

export async function fetchMessageCenterThreads(
  params: FetchMessageCenterParams
): Promise<ApiEnvelope<MessageCenterResponse>> {
  const sp = new URLSearchParams()
  sp.set('page', String(params.page))
  sp.set('limit', String(params.limit))
  if (params.q) sp.set('q', params.q)
  if (params.source) sp.set('source', params.source)
  if (params.status && params.status !== MESSAGE_CENTER_STATUS_FILTER_ALL) sp.set('status', params.status)
  const res = await fetch(`/api/v1/admin/message-center?${sp.toString()}`, {
    cache: 'no-store',
    credentials: 'same-origin'
  })
  let json: ApiEnvelope<MessageCenterResponse>
  try {
    json = (await res.json()) as ApiEnvelope<MessageCenterResponse>
  } catch {
    return {
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: 'Invalid response from server',
        statusCode: res.status || 500
      }
    }
  }
  if (!res.ok) {
    if (!json.success) return json
    return {
      success: false,
      error: { code: 'HTTP_ERROR', message: 'Request failed', statusCode: res.status }
    }
  }
  return json
}
