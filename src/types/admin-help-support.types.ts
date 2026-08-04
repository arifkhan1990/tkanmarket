export type SupportKnowledgeCardLayout = 'WIDE' | 'NARROW' | 'FULL'

export type SupportKnowledgeCategoryDto = {
  id: number
  title: string
  description: string
  iconKey: string
  layout: SupportKnowledgeCardLayout
  highlights: { label: string }[]
}

export type SupportTroubleshootingDto = {
  id: number
  code: string
  title: string
}

export type HelpSupportPipelineDto = {
  scraperMetricLabel: string
  scraperMetricValue: string
  scraperBarPercent: number
  nlpMetricLabel: string
  nlpMetricValue: string
  nlpBarPercent: number
  statusLabel: 'Active' | 'Degraded'
}

export type AdminHelpSupportOverviewResponse = {
  knowledgeCategories: SupportKnowledgeCategoryDto[]
  troubleshooting: SupportTroubleshootingDto[]
  pipeline: HelpSupportPipelineDto
}

export type SupportTicketServiceArea = 'CRAWLER' | 'AI' | 'WEB' | 'DATABASE'

export type SupportTicketUrgency = 'NORMAL' | 'HIGH' | 'CRITICAL'

export type CreateInternalSupportTicketInput = {
  submittedByUserId: number
  serviceArea: SupportTicketServiceArea
  urgency: SupportTicketUrgency
  subject: string
  description: string
}

export type CreateInternalSupportTicketResult = {
  id: number
}
