export interface FabricStats {
  total: number
  pending_review: number
  ai_processing: number
  published_today: number
}

export interface LeadStats {
  total: number
  new_today: number
  open: number
  closed_won_this_month: number
}

export interface SocialStats {
  posts_this_week: number
  scheduled: number
  published_total: number
}

export interface CrawlerStats {
  last_run_at: string | null
  last_run_status: string | null
  products_found_last_run: number
  products_saved_last_run: number
  running_jobs: number
}

export interface FabricsPublishedSeriesPoint {
  date: string
  count: number
}

export interface LeadsBySourcePoint {
  source: string
  count: number
}

export interface TrafficVsConversionsPoint {
  date: string
  traffic: number
  conversions: number
}

export interface TopFabricCategoriesPoint {
  category: string
  count: number
}

