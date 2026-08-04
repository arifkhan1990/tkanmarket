export type GlobalSearchFabricHit = {
  id: number
  title: string
  sku: string | null
  imageUrl: string | null
  slug: string
}

export type GlobalSearchSupplierHit = {
  id: number
  name: string
  verified: boolean
  initials: string
}

export type GlobalSearchLeadHit = {
  id: number
  contactName: string
  companyName: string
  title: string
}

export type GlobalSearchTrendingCategory = {
  slug: string
  label: string
  count: number
}

export type AdminGlobalSearchResponse = {
  fabrics: GlobalSearchFabricHit[]
  suppliers: GlobalSearchSupplierHit[]
  leads: GlobalSearchLeadHit[]
  trendingCategories: GlobalSearchTrendingCategory[]
}

/** Client-side filter for which result groups are shown in the admin command palette. */
export type AdminGlobalSearchScope = 'all' | 'fabrics' | 'suppliers' | 'leads'
