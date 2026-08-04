import type { LeadSource, LeadStatus } from '@/types/marketplace.types'

/**
 * Radix `<SelectItem />` must not use `value=""`. Use this for “all statuses” in the inbox filter.
 */
export const MESSAGE_CENTER_STATUS_FILTER_ALL = '__mc_all__' as const

export type MessageCenterStatusFilterValue = typeof MESSAGE_CENTER_STATUS_FILTER_ALL | LeadStatus

const LEAD_STATUS_VALUES: readonly LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'CLOSED_WON',
  'CLOSED_LOST'
]

export function parseMessageCenterStatusQueryParam(raw: string | null): MessageCenterStatusFilterValue {
  const s = raw?.trim() ?? ''
  if (!s) return MESSAGE_CENTER_STATUS_FILTER_ALL
  return (LEAD_STATUS_VALUES as readonly string[]).includes(s) ? (s as LeadStatus) : MESSAGE_CENTER_STATUS_FILTER_ALL
}

export interface MessageThreadRow {
  id: number
  companyName: string
  contactName: string
  preview: string
  source: LeadSource
  status: LeadStatus
  updatedAt: string
  unreadHint: boolean
}

export interface MessageCenterStats {
  totalActive: number
  newCount: number
  contactedCount: number
  qualifiedCount: number
  proposalCount: number
  closedWonCount: number
}

export interface MessageCenterResponse {
  threads: MessageThreadRow[]
  stats: MessageCenterStats
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  generatedAt: string
}
