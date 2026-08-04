export interface FabricTaxonomyCategoryRow {
  slug: string
  fabric_count: number
}

export interface FabricTaxonomyActivityRow {
  id: number
  event_type: string
  message: string
  created_at: string
}

export interface FabricTaxonomySampleFabric {
  id: number
  slug: string
  title_ru: string
  title_en: string | null
  gsm: number | null
  width_cm: number | null
  fabric_type: string | null
  composition_label: string | null
  images: string[] | null
}

export interface FabricTaxonomyOverview {
  categories: FabricTaxonomyCategoryRow[]
  selected_slug: string | null
  sample: FabricTaxonomySampleFabric | null
  activity: FabricTaxonomyActivityRow[]
}
