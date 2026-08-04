export type PublicOrderTrackingTimelineState = 'done' | 'current' | 'pending'

export interface PublicOrderTrackingTimelineStep {
  id: string
  title: string
  description: string
  dateLabel: string | null
  state: PublicOrderTrackingTimelineState
  progressPercent: number | null
}

export interface PublicOrderTrackingSupplier {
  id: number
  name: string
  slug: string
  city: string | null
  country: string
  logo_url: string | null
}

export interface PublicOrderTrackingManifestLine {
  sku: string
  title: string
  subtitle: string | null
  quantity_label: string
  unit_price_label: string
  line_total_label: string
}

export interface PublicOrderTrackingResponse {
  order_reference: string
  buyer_company_name: string
  status: 'PROCESSING' | 'IN_TRANSIT' | 'DELIVERED' | 'ON_HOLD'
  total_meters: number
  estimated_value_usd: number | null
  ordered_at: string
  supplier: PublicOrderTrackingSupplier
  timeline: PublicOrderTrackingTimelineStep[]
  manifest_lines: PublicOrderTrackingManifestLine[]
  shipping_summary: {
    label: string
    carrier_preference: string
  }
}
