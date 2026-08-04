import type { LeadSource, LeadStatus } from '@/types/marketplace.types'

export type LeadKanbanColumnKey =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATING'
  | 'CLOSED'

export interface AdminKanbanLead {
  id: number
  status: LeadStatus
  source: LeadSource
  company_name: string
  contact_name: string
  email: string
  created_at: string
  /** 0–100 heuristic score (see `computeLeadScore`). */
  score: number
  assigned_user: { id: number; name: string; email: string; avatar_url: string | null } | null
  fabric: { id: number; slug: string; title_ru: string } | null
}

export interface AdminLeadsKanbanResponse {
  columns: Record<LeadKanbanColumnKey, AdminKanbanLead[]>
  counts: Record<LeadKanbanColumnKey, number>
}

