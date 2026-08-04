import type { LeadSource, LeadStatus } from '@/types/marketplace.types'
import type { FabricSummary } from '@/types/marketplace.types'

export interface Lead {
  id: number
  source: LeadSource
  status: LeadStatus
  companyName: string
  contactName: string
  email: string
  phone: string | null
  country: string
  city: string | null
  fabricId: number | null
  inquiryText: string
  assignedToId: number | null
  utmSource: string | null
  utmCampaign: string | null
  utmMedium: string | null
  createdAt: string
  updatedAt: string
}

export interface LeadSummary {
  id: number
  status: LeadStatus
  source: LeadSource
  companyName: string
  contactName: string
  email: string
  phone: string | null
  country: string
  assignedTo: { id: number; name: string; email: string; avatarUrl?: string | null } | null
  fabric: Pick<FabricSummary, 'id' | 'slug' | 'titleRu' | 'imageUrl' | 'supplierName'> | null
  createdAt: string
}

export interface LeadNote {
  id: number
  leadId: number
  author: { id: number; name: string; email: string; avatarUrl?: string | null } | null
  content: string
  createdAt: string
}

export interface LeadActivity {
  id: number
  leadId: number
  actor: { id: number; name: string; email: string; avatarUrl?: string | null } | null
  eventType: string
  payload: unknown
  createdAt: string
}

export interface LeadScoringSnapshot {
  total: number
  budgetAlignment: number
  volumeRequirement: number
  urgencyTimeline: number
}

export interface LeadDetail {
  lead: Lead
  assignedTo: { id: number; name: string; email: string; avatarUrl?: string | null } | null
  fabric: Pick<FabricSummary, 'id' | 'slug' | 'titleRu' | 'imageUrl' | 'supplierName'> | null
  notes: LeadNote[]
  activity: LeadActivity[]
  scoring: LeadScoringSnapshot
}

export interface LeadListFilters {
  q?: string
  status?: LeadStatus
  assignedToId?: number
  source?: LeadSource
  country?: string
  createdFrom?: Date
  createdTo?: Date
}

