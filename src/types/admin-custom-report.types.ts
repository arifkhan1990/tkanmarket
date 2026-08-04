export type CustomReportDataSourceId = 'leads' | 'fabrics' | 'revenue'

export interface CustomReportDataSourceOption {
  id: CustomReportDataSourceId
  rowCount: number
}

export interface CustomReportPreviewRow {
  transactionId: string
  sourcePartner: string
  fabricType: string | null
  /** Raw MOQ in metres, null when missing — client localizes the unit. */
  quantityMeters: number | null
  /** Raw line value in USD, null when missing — client localizes currency. */
  totalValueUsd: number | null
}

export interface CustomReportChartBar {
  fabricId: number
  sku: string | null
  label: string
  /** Raw lead count for this fabric over the period — used by bar/line charts. */
  leadCount: number
  /** Raw closed-won count — used by stacked / dual charts. */
  wonCount: number
  /** 0..100 height percent for the legacy bar renderer. */
  heightPercent: number
  /** 0..100 conversion percent. */
  conversionPercent: number
}

export interface CustomReportCanvasTableRow {
  sku: string | null
  conversionPercent: number
  ratingStars: number
  trendPercent: number
  trendDirection: 'up' | 'flat' | 'down'
}

export type CustomReportTrendKind = 'UP' | 'DOWN' | 'FLAT' | 'INSUFFICIENT_DATA'

export interface CustomReportTrendSignal {
  kind: CustomReportTrendKind
  /** Magnitude in absolute percent — null when `kind === 'INSUFFICIENT_DATA'`. */
  deltaPercent: number | null
  recentLeadCount: number
  previousLeadCount: number
}

export interface CustomReportResponse {
  reportId: string
  /** Raw period bounds in ISO so the client can format with locale. */
  periodFrom: string
  periodTo: string
  generatedAt: string
  dataSources: CustomReportDataSourceOption[]
  previewRows: CustomReportPreviewRow[]
  summary: {
    totalRows: number
    activePartners: number
    /** Raw aggregated revenue in USD; client localizes the currency. */
    aggregatedValueUsd: number
  }
  trend: CustomReportTrendSignal
  chartBars: CustomReportChartBar[]
  canvasTable: CustomReportCanvasTableRow[]
}
