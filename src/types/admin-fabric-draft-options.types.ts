export interface AdminFabricDraftOption {
  id: number
  title: string
  supplier_name: string
  status: string
  thumb_url: string | null
}

export interface AdminFabricDraftOptionsData {
  items: AdminFabricDraftOption[]
}

export interface AdminFabricDraftOptionsResponse {
  items: AdminFabricDraftOption[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

