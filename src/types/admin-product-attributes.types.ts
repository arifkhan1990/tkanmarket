export interface FabricTypeCountRow {
  fabricType: string | null
  count: number
}

export interface TagCountRow {
  tag: string
  count: number
}

export interface ProductAttributesOverviewResponse {
  fabricTypes: FabricTypeCountRow[]
  topTags: TagCountRow[]
  stats: {
    totalFabrics: number
    withGsm: number
    avgGsm: number | null
    withComposition: number
  }
}
