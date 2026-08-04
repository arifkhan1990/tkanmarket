export interface PromotionAnalyticsWeeklyPoint {
  weekStart: string
  reach: number
  linkClicks: number
  posts: number
}

export interface PromotionAnalyticsResponse {
  series: PromotionAnalyticsWeeklyPoint[]
  totals: {
    reach: number
    clicks: number
    posts: number
  }
  periodLabel: string
}
