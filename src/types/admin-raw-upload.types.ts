export type AdminRawUploadStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export type AdminRawUploadRowStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface AdminRawUploadSummary {
  id: number
  filename: string
  originalFileUrl: string | null
  fileType: string
  status: AdminRawUploadStatus
  totalRows: number
  processedRows: number
  errorRows: number
  uploadedByUserId: number
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminRawUploadRowSummary {
  id: number
  uploadId: number
  rowIndex: number
  rawData: Record<string, unknown>
  normalizedData: Record<string, unknown> | null
  status: AdminRawUploadRowStatus
  errorMessage: string | null
}

export interface AdminRawUploadProcessResult {
  processedCount: number
  errorCount: number
}

export interface AdminRawUploadEnqueueResult {
  enqueuedCount: number
}