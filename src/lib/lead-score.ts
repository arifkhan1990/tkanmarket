import type { LeadSource, LeadStatus } from '@/types/marketplace.types'

export interface LeadScoreInput {
  source: LeadSource
  status: LeadStatus
  inquiryText: string
  fabricId: number | null
  country: string
}

export interface LeadScoreResult {
  total: number
  budgetAlignment: number
  volumeRequirement: number
  urgencyTimeline: number
}

const STATUS_WEIGHT: Record<LeadStatus, number> = {
  NEW: 0,
  CONTACTED: 6,
  QUALIFIED: 14,
  PROPOSAL_SENT: 18,
  NEGOTIATING: 22,
  CLOSED_WON: 28,
  CLOSED_LOST: 4
}

const SOURCE_WEIGHT: Record<LeadSource, number> = {
  MARKETPLACE_INQUIRY: 18,
  SAMPLE_REQUEST: 12,
  SOCIAL_CAMPAIGN: 10,
  DIRECT_CONTACT: 8,
  MANUAL_ENTRY: 6
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/**
 * Deterministic 0–100 lead score plus sub-dimensions (0–10 each) for CRM UI.
 * Uses only fields already stored on `leads` — no external APIs.
 */
export function computeLeadScore(input: LeadScoreInput): LeadScoreResult {
  const text = input.inquiryText.toLowerCase()
  const len = input.inquiryText.trim().length

  const inquiryPts = clamp(Math.round(len / 25), 0, 22)
  const fabricPts = input.fabricId != null ? 12 : 0
  const sourcePts = SOURCE_WEIGHT[input.source] ?? 6
  const statusPts = STATUS_WEIGHT[input.status] ?? 0

  const budgetHints = /budget|price|€|\$|usd|eur|rub|moq|order|volume|meters|метр|цена|стоим/i.test(text)
  const budgetAlignment = clamp(
    4 + (budgetHints ? 4 : 0) + (input.fabricId != null ? 2 : 0) + (len > 120 ? 1 : 0),
    0,
    10
  )

  const volumeHints = /\d{2,}\s*(m|meter|metre|м|км|k\s*m|000)/i.test(text) || /\b\d{3,}\b/.test(text)
  const volumeRequirement = clamp(3 + (volumeHints ? 5 : 0) + (len > 80 ? 2 : 0), 0, 10)

  const urgencyHints = /urgent|asap|срочн|immediate|this week|q[1-4]|quarter|deadline|скоро/i.test(text)
  const urgencyTimeline = clamp(3 + (urgencyHints ? 5 : 0) + (statusPts > 10 ? 2 : 0), 0, 10)

  const raw = inquiryPts + fabricPts + sourcePts + statusPts + hashString(input.country + input.source) % 7
  const total = clamp(Math.round(raw), 0, 100)

  return {
    total,
    budgetAlignment,
    volumeRequirement,
    urgencyTimeline
  }
}
