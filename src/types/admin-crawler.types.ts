export interface AdminCrawlerRun {
  id: number
  status: string
  source: string
  keywords: string[]
  productsFound: number
  productsSaved: number
  errorsCount: number
  startedAt: string | null
  completedAt: string | null
}

export interface AdminCrawlerStatusResponse {
  runningCount: number
  latestRun: AdminCrawlerRun | null
  history: AdminCrawlerRun[]
}

export interface AdminCrawlerHistoryStats {
  jobs24h: number
  productsFound24h: number
  successRatePercent: number | null
  activeRunners: number
}

export interface AdminCrawlerHistoryResponse {
  items: AdminCrawlerRun[]
  total: number
  page: number
  pageSize: number
  stats: AdminCrawlerHistoryStats
}

export interface AdminCrawlerDiagnosticsResponse {
  queue: {
    waiting: number
    active: number
    completed: number
    failed: number
  }
  /** False when BullMQ could not be queried; {@link queue} counts are zero placeholders. */
  queueMetricsAvailable: boolean
  /** Error message when queue metrics failed (e.g. missing REDIS_URL). */
  queueMetricsNote: string | null
  workerConcurrency: number
  crawlerEnabled: boolean
  /** Approximate products saved per second over the last hour (DB-derived). */
  throughputPerSec: number
  db: {
    totalRuns: number
    rawProductsCount: number
    fabricsRawScrapedCount: number
    runsLast24h: number
    productsSavedLastHour: number
  }
  sourcesSupported: Array<{ id: string; label: string; enabled: boolean }>
  /** Recent runs with failures or stored error logs (newest first). */
  recentIssues: Array<{
    id: number
    status: string
    errorPreview: string | null
    completedAt: string | null
  }>
}

export interface ReconcileStaleCrawlerRunsResponse {
  reconciledCount: number
  details: string[]
}

export interface CancelRunResponse {
  ok: boolean
  message: string
}

export interface AdminCrawlerRunDetailResponse {
  run: {
    id: number
    status: string
    source: string
    keywords: string[]
    productsFound: number
    productsSaved: number
    errorsCount: number
    startedAt: string | null
    completedAt: string | null
    errorLog: string | null
  } | null
}
