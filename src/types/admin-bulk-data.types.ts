export type BulkDataJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL'

export interface BulkDataOperationSummary {
  id: number
  status: BulkDataJobStatus
  source: string
  productsFound: number
  productsSaved: number
  errorsCount: number
  startedAt: string | null
  completedAt: string | null
}

export interface BulkDataOperationsMetrics {
  totalProcessed: number
  totalSuccessful: number
  totalWarnings: number
}

export interface BulkDataOperationsResponse {
  activeRun: BulkDataOperationSummary | null
  runningCount: number
  recentHistory: BulkDataOperationSummary[]
  metrics: BulkDataOperationsMetrics
}

