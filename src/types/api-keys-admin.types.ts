import type { PaginationMeta } from '@/types/api-envelope.types'

export interface ApiKeyListItem {
  id: number
  name: string
  prefix: string
  scopes: string[] | null
  last_used_at: string | null
  revoked_at: string | null
  is_active: boolean
  created_at: string
  created_by_name?: string | null
  created_by_email?: string | null
}

export interface ApiKeysListResponse {
  items: ApiKeyListItem[]
  meta: PaginationMeta
}

export interface ApiKeyCreateResponse {
  api_key: ApiKeyListItem
  secret: string
  preview: string
}

export interface ApiKeyRevokeResponse {
  api_key: Pick<ApiKeyListItem, 'id' | 'is_active' | 'revoked_at'>
}

export interface CrawlerIntegrationItem {
  source: string
  status: string | null
  last_run_at: string | null
  products_found: number
  products_saved: number
  errors_count: number
  enabled: boolean
}

export interface CrawlerIntegrationsResponse {
  items: CrawlerIntegrationItem[]
}

