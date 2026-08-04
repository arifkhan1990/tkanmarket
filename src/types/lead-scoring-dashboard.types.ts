import type { LeadSource, LeadStatus } from '@/types/marketplace.types'

export interface LeadScoringListItem {
  id: number
  companyName: string
  contactName: string
  country: string
  source: LeadSource
  status: LeadStatus
  fabricTitleRu: string | null
  createdAt: string
  score: number
  qualificationLabel: 'qualified' | 'assessing' | 'new' | 'flagged'
}

export interface LeadScoringDashboardResponse {
  items: LeadScoringListItem[]
  metrics: {
    /** Leads created in the last 30 days. */
    totalLeads30d: number
    /** Mean heuristic score (0–100) across recent leads. */
    avgScore: number
    /** Share of recent leads in `QUALIFIED` or later stages. */
    qualifiedRatePercent: number
    /** `CLOSED_WON` ÷ closed outcomes in the last 90 days (0 if none). */
    winRatePercent: number
  }
  velocity: Array<{ day: string; count: number }>
  selectedBreakdown: {
    leadId: number
    companyName: string
    budgetAlignment: number
    volumeRequirement: number
    urgencyTimeline: number
    insight: string
  } | null
}
