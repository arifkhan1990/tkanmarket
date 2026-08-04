export interface CatalogImportPreviewRow {
  id: number
  skuOrId: string
  title: string
  priceText: string | null
  status: 'valid' | 'invalid'
  statusDetail: string | null
}

export interface CatalogImportPreviewResponse {
  rows: CatalogImportPreviewRow[]
  connection: {
    lastSuccessfulAt: string | null
    feedSourceLabel: string
    refreshNote: string
  }
}
