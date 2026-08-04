export interface AdminBulkSeoRow {
  id: number
  slug: string
  sku: string | null
  titleRu: string
  supplierName: string
  imageUrl: string | null

  metaTitleRu: string | null
  metaDescriptionRu: string | null
  imageAltRu: string | null
  metaTitleEn: string | null
  metaDescriptionEn: string | null
  imageAltEn: string | null
}

export interface AdminBulkSeoListResponse {
  items: AdminBulkSeoRow[]
}

export interface AdminBulkSeoStats {
  healthScorePercent: number
  missingMetaCount: number
  totalFabrics: number
}

export interface AdminBulkSeoQuery {
  page: number
  limit: number
  q?: string
  missing?: 'meta_title' | 'meta_description' | 'image_alt' | 'meta_title_en' | 'meta_description_en' | 'image_alt_en'
}

export interface AdminBulkSeoUpdateItem {
  id: number
  metaTitleRu?: string | null
  metaDescriptionRu?: string | null
  imageAltRu?: string | null
  metaTitleEn?: string | null
  metaDescriptionEn?: string | null
  imageAltEn?: string | null
}

export interface AdminBulkSeoBulkUpdatePayload {
  updates: AdminBulkSeoUpdateItem[]
}

