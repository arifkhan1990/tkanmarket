export interface PromotionManagerStats {
  /** SUM of `social_posts.reach` over the last 30 days. */
  dailyImpressions: number
  impressionsDeltaPercent: number | null
  avgCtrPercent: number
  ctrDeltaPercent: number | null
  linkClicks: number
  clicksDeltaPercent: number | null
  /** Posts whose status is APPROVED, SCHEDULED, or PUBLISHED (and not soft-deleted). */
  liveCampaigns: number
}

export interface PromotionPlatformAggregate {
  platform: string
  posts: number
  reach: number
  clicks: number
}

export interface PromotionStatusAggregate {
  status: string
  count: number
}

export interface PromotionDailyPoint {
  date: string
  reach: number
  clicks: number
}

export interface PromotionCampaignRow {
  id: number
  fabricId: number
  fabricTitle: string
  platform: string
  status: string
  scheduledAt: string | null
  publishedAt: string | null
  reach: number | null
  linkClicks: number | null
  updatedAt: string
}

export interface PromotionManagerResponse {
  stats: PromotionManagerStats
  platforms: PromotionPlatformAggregate[]
  statuses: PromotionStatusAggregate[]
  daily: PromotionDailyPoint[]
  campaigns: PromotionCampaignRow[]
  generated_at: string
}
