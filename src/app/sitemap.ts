import type { MetadataRoute } from 'next'
import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import { getPublicSiteUrl } from '@/lib/utils/seo'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/types/i18n.types'

function localizedAbsolutePath(baseUrl: string, locale: Locale, pathname: string): string {
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (clean === '/') return `${baseUrl}/${locale}`
  return `${baseUrl}/${locale}${clean}`
}

function hrefLangAlternates(baseUrl: string, pathname: string): NonNullable<MetadataRoute.Sitemap[number]['alternates']>['languages'] {
  return {
    en: localizedAbsolutePath(baseUrl, 'en', pathname),
    ru: localizedAbsolutePath(baseUrl, 'ru', pathname),
    zh: localizedAbsolutePath(baseUrl, 'zh', pathname),
    'x-default': localizedAbsolutePath(baseUrl, DEFAULT_LOCALE, pathname),
  }
}

function entry(
  baseUrl: string,
  locale: Locale,
  pathname: string,
  opts: {
    lastModified: Date
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
    priority: number
  }
): MetadataRoute.Sitemap[number] {
  return {
    url: localizedAbsolutePath(baseUrl, locale, pathname),
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages: hrefLangAlternates(baseUrl, pathname) },
  }
}

const STATIC_PATHS: Array<{
  path: string
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/fabrics', changeFrequency: 'daily', priority: 0.8 },
  { path: '/fabrics/compare', changeFrequency: 'weekly', priority: 0.65 },
  { path: '/suppliers', changeFrequency: 'daily', priority: 0.8 },
  { path: '/about', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.55 },
  { path: '/bulk-inquiry', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/sample-request', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/wishlist', changeFrequency: 'weekly', priority: 0.45 },
  { path: '/cookie-preferences', changeFrequency: 'yearly', priority: 0.25 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicSiteUrl()
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    STATIC_PATHS.map(({ path, changeFrequency, priority }) =>
      entry(baseUrl, locale, path, { lastModified: now, changeFrequency, priority })
    )
  )

  try {
    const db = getDb()
    const [fabricRows, supplierRows] = await Promise.all([
      db
        .select({ slug: fabrics.slug, updatedAt: fabrics.updatedAt })
        .from(fabrics)
        .where(and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved'))),
      db
        .select({ slug: suppliers.slug, updatedAt: suppliers.updatedAt })
        .from(suppliers)
        .where(isNull(suppliers.deletedAt)),
    ])

    const fabricPages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
      fabricRows.map((r) =>
        entry(baseUrl, locale, `/fabrics/${r.slug}`, {
          lastModified: r.updatedAt ?? now,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      )
    )

    const supplierPages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
      supplierRows.map((r) =>
        entry(baseUrl, locale, `/suppliers/${r.slug}`, {
          lastModified: r.updatedAt ?? now,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      )
    )

    return [...staticPages, ...fabricPages, ...supplierPages]
  } catch {
    return staticPages
  }
}
