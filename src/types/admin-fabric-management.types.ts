import type { FabricCompositionItem } from '@/types/fabric'

export type AdminFabricStatus = 'raw_scraped' | 'ai_processing' | 'ai_processed' | 'approved' | 'rejected'

export interface AdminFabricListItem {
  id: number
  slug: string
  title_ru: string
  title_en: string | null
  supplier_name: string
  status: AdminFabricStatus
  fabric_type: string | null
  gsm: number | null
  width_cm: number | null
  moq: number | null
  price_usd: string | null
  ai_confidence_score: string | null
  created_at: string
  thumb_url: string | null

  has_blog: boolean
  blog_slug: string | null
  has_video: boolean
  video_post_id: number | null
  has_social: boolean
  social_post_id: number | null
}

export interface AdminFabricListCounts {
  all: number
  raw_scraped: number
  ai_processing: number
  ai_processed: number
  approved: number
  rejected: number
}

export interface AdminFabricListResponse {
  items: AdminFabricListItem[]
  total: number
  counts: AdminFabricListCounts
}

/** Dropdown options for admin fabric list supplier filter. */
export interface AdminSupplierOption {
  id: number
  name: string
}

/** Distinct category slugs from `fabric_categories` (junction). */
export interface AdminFabricCategoryOption {
  slug: string
}

export interface AdminFabricDetail {
  id: number
  slug: string
  sku: string | null
  supplier_id: number
  supplier_name: string
  status: AdminFabricStatus

  title_ru: string
  title_en: string | null
  description_ru: string | null
  description_en: string | null
  usage_ru: string | null
  usage_en: string | null

  meta_title_ru: string | null
  meta_title_en: string | null
  meta_description_ru: string | null
  meta_description_en: string | null
  image_alt_ru: string | null
  image_alt_en: string | null

  color: string | null
  color_en: string | null
  supply_type: string | null
  supply_type_en: string | null
  shipment_time: string | null
  shipment_time_en: string | null

  fabric_type: string | null
  gsm: number | null
  width_cm: number | null
  moq: number | null
  price_usd: string | null

  composition: FabricCompositionItem[] | null
  tags: string[] | null
  tags_en: string[] | null
  images: string[] | null

  source_url: string | null
  raw_title: string | null
  raw_description: string | null

  ai_confidence_score: string | null
  ai_processed_at: string | null

  is_featured: boolean

  created_at: string
  updated_at: string
}

export interface AdminFabricUpdateInput {
  title_ru: string
  title_en: string | null
  description_ru: string | null
  description_en: string | null
  usage_ru?: string | null
  usage_en?: string | null
  fabric_type: string | null
  gsm: number | null
  width_cm: number | null
  moq: number | null
  price_usd: string | null
  composition: FabricCompositionItem[] | null
  tags: string[] | null
  tags_en?: string[] | null
  color_en?: string | null
  supply_type_en?: string | null
  shipment_time_en?: string | null
  meta_title_ru?: string | null
  meta_title_en?: string | null
  meta_description_ru?: string | null
  meta_description_en?: string | null
  image_alt_ru?: string | null
  image_alt_en?: string | null
  color?: string | null
  supply_type?: string | null
  shipment_time?: string | null
  is_featured: boolean
}

export interface BulkFabricRowInput {
  title_ru: string
  title_en?: string | null
  fabric_type?: string | null
  gsm?: number | null
  width_cm?: number | null
  price_usd?: string | null
  moq?: number | null
  tags?: string[] | null
  sku?: string | null
  usage_ru?: string | null
  description_ru?: string | null
  color?: string | null
  color_en?: string | null
  supply_type?: string | null
  supply_type_en?: string | null
  shipment_time?: string | null
  shipment_time_en?: string | null
  supplier_name?: string | null
  composition?: FabricCompositionItem[] | null
  images?: string[] | null
}

export interface BulkFabricCreateInput {
  supplier_id?: number
  rows: BulkFabricRowInput[]
}

export interface BulkFabricCreateResponse {
  ids: number[]
}

export type BulkImportJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED'

export interface BulkImportJobSummary {
  id: number
  supplier_id: number
  supplier_name: string
  filename: string
  total_rows: number
  success_count: number
  error_count: number
  status: BulkImportJobStatus
  errors: Array<{ row: number; sku?: string; field: string; message: string }> | null
  created_by_id: number | null
  created_at: string
  updated_at: string
}

