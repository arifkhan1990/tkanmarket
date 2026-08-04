export type CatalogExportFormat = 'CSV' | 'XLSX' | 'JSON'

export type CatalogExportStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface CatalogExportJobSummary {
  id: number
  jobName: string
  format: CatalogExportFormat
  status: CatalogExportStatus
  recordCount: number
  estimatedSizeBytes: number
  createdAt: string
}

export interface CatalogExportMetrics {
  totalExportsThisMonth: number
  totalRecordsThisMonth: number
  usedBytesThisMonth: number
  quotaBytes: number
}

export interface CatalogExportOverviewResponse {
  activeJob: CatalogExportJobSummary | null
  recentJobs: CatalogExportJobSummary[]
  metrics: CatalogExportMetrics
}

export interface CreateCatalogExportPayload {
  format: CatalogExportFormat
  fields: string[]
  filters?: {
    status?: string
    category?: string
    supplier?: string
  }
}

