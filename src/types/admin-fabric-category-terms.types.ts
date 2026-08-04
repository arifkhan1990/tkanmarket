export type AdminFabricCategoryTerm = {
  id: number
  slug: string
  name_ru: string
  name_en: string | null
  description_ru: string | null
  description_en: string | null
  sort_order: number
  is_active: boolean
  deleted_at?: string | null
  created_at: string
  updated_at: string
}

export type AdminFabricCategoryTermListResponse = {
  items: AdminFabricCategoryTerm[]
  total: number
}

export type AdminFabricCategoryTermCreateInput = {
  slug: string
  name_ru: string
  name_en?: string | null
  description_ru?: string | null
  description_en?: string | null
  sort_order?: number
  is_active?: boolean
}

export type AdminFabricCategoryTermUpdateInput = {
  slug?: string
  name_ru?: string
  name_en?: string | null
  description_ru?: string | null
  description_en?: string | null
  sort_order?: number
  is_active?: boolean
}

