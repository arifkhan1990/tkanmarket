import { asc, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import {
  internalSupportTickets,
  supportKnowledgeCategories,
  supportTroubleshootingEntries
} from '@/db/schema/support.schema'
import type {
  AdminHelpSupportOverviewResponse,
  CreateInternalSupportTicketInput,
  CreateInternalSupportTicketResult,
  SupportKnowledgeCategoryDto
} from '@/types/admin-help-support.types'
import type { SystemHealthResponse } from '@/types/admin-system-health.types'

import { AdminSystemHealthService } from '@/services/admin-system-health.service'

function mapPipeline(health: SystemHealthResponse): AdminHelpSupportOverviewResponse['pipeline'] {
  const latency = health.api_latency_p95_ms
  const latencyPct = Math.min(100, Math.max(0, 100 - Math.min(100, latency / 5)))
  const dbLoad = health.db_load_capacity_percent
  const errEstimate = Math.min(100, Math.max(0, 100 - dbLoad))

  const degraded = health.nodes.some((n) => n.status === 'DEGRADED') || health.uptime_percent < 99

  return {
    scraperMetricLabel: 'Scraper_Engine_v2',
    scraperMetricValue: `${latencyPct.toFixed(1)}% Latency`,
    scraperBarPercent: latencyPct,
    nlpMetricLabel: 'NLP_Classify_Service',
    nlpMetricValue: `${errEstimate.toFixed(2)}% Errors`,
    nlpBarPercent: 100 - errEstimate,
    statusLabel: degraded ? 'Degraded' : 'Active'
  }
}

export class AdminHelpSupportService {
  public static async getOverview(): Promise<AdminHelpSupportOverviewResponse> {
    const db = getDb()

    const [knowledgeRows, troubleRows, health] = await Promise.all([
      db
        .select()
        .from(supportKnowledgeCategories)
        .where(isNull(supportKnowledgeCategories.deletedAt))
        .orderBy(asc(supportKnowledgeCategories.sortOrder)),
      db
        .select()
        .from(supportTroubleshootingEntries)
        .where(isNull(supportTroubleshootingEntries.deletedAt))
        .orderBy(asc(supportTroubleshootingEntries.sortOrder)),
      AdminSystemHealthService.get({ range: '24H', level: 'ALL' })
    ])

    const knowledgeCategories: SupportKnowledgeCategoryDto[] = knowledgeRows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      iconKey: r.iconKey,
      layout: r.layout as SupportKnowledgeCategoryDto['layout'],
      highlights: Array.isArray(r.highlights) ? (r.highlights as { label: string }[]) : []
    }))

    const troubleshooting = troubleRows.map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title
    }))

    return {
      knowledgeCategories,
      troubleshooting,
      pipeline: mapPipeline(health)
    }
  }

  public static async createTicket(input: CreateInternalSupportTicketInput): Promise<CreateInternalSupportTicketResult> {
    const db = getDb()

    const [row] = await db
      .insert(internalSupportTickets)
      .values({
        submittedByUserId: input.submittedByUserId,
        serviceArea: input.serviceArea,
        urgency: input.urgency,
        subject: input.subject,
        description: input.description
      })
      .returning({ id: internalSupportTickets.id })

    if (!row) {
      throw new Error('Failed to create ticket')
    }

    return { id: row.id }
  }
}
