export type AdminRawProcessingLogStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED'

export interface AdminRawProcessingLogSummary {
  id: number
  uploadId: number
  rowId: number
  fabricId: number | null
  status: AdminRawProcessingLogStatus
  aiConfidenceScore: string | null
  aiProcessedAt: string | null
  aiStatus: string | null
  errorMessage: string | null
  retriesCount: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminRawProcessingLogStats {
  total: number
  completed: number
  failed: number
  pending: number
}
