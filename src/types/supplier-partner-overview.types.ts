export interface SupplierPartnerFabricRow {
  id: number
  sku: string | null
  title: string
  views_count: number
  image_url: string | null
  slug: string
}

export interface SupplierPartnerLeadSnippet {
  company_name: string
  inquiry_excerpt: string
  created_at: string
  is_new: boolean
}

export interface SupplierPartnerOverviewResponse {
  supplier: {
    id: number
    name: string
    slug: string
    city: string | null
    country: string
    verified: boolean
    logo_url: string | null
  }
  metrics: {
    published_fabrics: number
    sample_request_leads: number
    response_rate_percent: number
    month_over_month_inquiry_delta_percent: number | null
  }
  top_fabrics: SupplierPartnerFabricRow[]
  recent_inquiries: SupplierPartnerLeadSnippet[]
}
