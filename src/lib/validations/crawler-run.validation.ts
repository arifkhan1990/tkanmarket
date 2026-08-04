import { z } from 'zod'

import { CRAWLER_CATALOG_SOURCES } from '@/types/crawler.types'

export const CrawlerCatalogSourceSchema = z.enum(CRAWLER_CATALOG_SOURCES)
