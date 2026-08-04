/** Catalog crawl marketplace scope (stored on `crawler_runs.source`). */
export const CRAWLER_CATALOG_SOURCES = ['alibaba', '1688', 'both', 'made_in_china', 'all'] as const
export type CrawlerSource = (typeof CRAWLER_CATALOG_SOURCES)[number]

export type CreateCrawlerRunParams = {
  source: CrawlerSource
  keywords: string[]
  maxProducts: number
  triggeredById?: number | null
}

export type CrawlerRun = {
  id: number
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL'
  source: string
  keywords: string[]
  productsFound: number
  productsSaved: number
  errorsCount: number
  startedAt: string | null
  completedAt: string | null
  errorLog: string | null
}

export type RawProductData = {
  url: string
  title: string
  description: string | null
  imageUrls: string[]
  priceText: string | null
  moqText: string | null
  compositionText: string | null
}

export type RawSupplierData = {
  name: string | null
  sourceUrl: string | null
  websiteUrl: string | null
  logoUrl: string | null
}

export type PageLike = {
  goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeout?: number }): Promise<void>
  waitForLoadState(state?: 'load' | 'domcontentloaded' | 'networkidle', options?: { timeout?: number }): Promise<void>
  waitForTimeout(ms: number): Promise<void>
  url(): string
  title(): Promise<string>
  textContent(selector: string): Promise<string | null>
  getAttribute(selector: string, name: string): Promise<string | null>
  evaluate<T>(pageFunction: () => T): Promise<T>
  $$eval<T>(selector: string, pageFunction: (elements: Element[]) => T): Promise<T>
}

