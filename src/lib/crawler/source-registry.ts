import type { PageLike } from '@/lib/crawler/browser'
import { scrape1688Product, search1688WithPage } from '@/lib/crawler/extractors/1688.extractor'
import { scrapeAlibabaProduct, searchAlibabaWithPage } from '@/lib/crawler/extractors/alibaba.extractor'
import {
  enrichMadeInChinaSupplierProfile,
  scrapeMadeInChinaProduct,
  searchMadeInChinaWithPage
} from '@/lib/crawler/extractors/made-in-china.extractor'
import type { SupplierDiscoverySource } from '@/types/supplier-discovery.types'

export type ScrapeProductResult = {
  title: string
  description: string | null
  imageUrls: string[]
  priceText: string | null
  moqText: string | null
  supplierName: string | null
  supplierUrl: string | null
  compositionText: string | null
  gsmText: string | null
  widthText: string | null
} | null

/** Optional profile scrape on the supplier showroom/company page (fetches address, logo, etc.). */
export type EnrichedSupplierProfile = {
  name: string | null
  logoUrl: string | null
  websiteUrl: string | null
  city: string | null
  province: string | null
  establishedYear: number | null
}

export interface SourceHandlers {
  search: (page: PageLike, keyword: string, maxPages: number) => Promise<string[]>
  scrapeProduct: (page: PageLike, url: string) => Promise<ScrapeProductResult>
  /** When present, called once per *new* supplier in discovery to fill showroom fields. */
  enrichSupplierProfile?: (page: PageLike, companyUrl: string) => Promise<EnrichedSupplierProfile | null>
}

const registry: Record<SupplierDiscoverySource, SourceHandlers> = {
  alibaba: {
    search: searchAlibabaWithPage,
    scrapeProduct: scrapeAlibabaProduct
  },
  '1688': {
    search: search1688WithPage,
    scrapeProduct: scrape1688Product
  },
  made_in_china: {
    search: searchMadeInChinaWithPage,
    scrapeProduct: scrapeMadeInChinaProduct,
    enrichSupplierProfile: enrichMadeInChinaSupplierProfile
  }
}

export function getSourceHandlers(source: SupplierDiscoverySource): SourceHandlers {
  return registry[source]
}
