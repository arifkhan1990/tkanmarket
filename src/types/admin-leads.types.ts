import type { LeadSource, LeadStatus } from '@/types/marketplace.types'

export interface AdminLeadCard {
  id: number
  status: LeadStatus
  source: LeadSource
  companyName: string
  contactName: string
  email: string
  phone: string | null
  fabricTitleRu: string | null
  createdAt: string
}

export interface AdminLeadNote {
  id: number
  content: string
  createdAt: string
  authorName: string | null
}

export interface AdminLeadDetail {
  lead: Omit<AdminLeadCard, 'createdAt'> & { createdAt: string }
  notes: AdminLeadNote[]
}

