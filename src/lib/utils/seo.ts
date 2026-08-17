import type { Metadata } from 'next'

import type { FabricDetail, SupplierDetail } from '@/types/marketplace.types'
import type { BlogPostDetail } from '@/types/blog.types'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/types/i18n.types'
import { getLocalizedFabricTitle } from '@/lib/i18n/localized-fabric'

function getSiteUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  return (fromEnv || 'http://localhost:3000').replace(/\/$/, '')
}

/** Public site origin (no trailing slash). Shared with sitemap / JSON-LD. */
export function getPublicSiteUrl(): string {
  return getSiteUrl()
}

/** Canonical + hreflang for the localized home URL. */
export function getHomePageAlternates(locale: Locale): Metadata['alternates'] {
  const baseUrl = getSiteUrl()
  const languages: Record<string, string> = {}
  for (const l of LOCALES) {
    languages[l] = `${baseUrl}/${l}`
  }
  languages['x-default'] = `${baseUrl}/${DEFAULT_LOCALE}`
  return {
    canonical: `${baseUrl}/${locale}`,
    languages
  }
}

/** Canonical + hreflang for a localized fabric detail URL. */
export function getFabricPageAlternates(slug: string, locale: Locale): Metadata['alternates'] {
  const baseUrl = getSiteUrl()
  const path = `fabrics/${slug}`
  const languages: Record<string, string> = {}
  for (const l of LOCALES) {
    languages[l] = `${baseUrl}/${l}/${path}`
  }
  languages['x-default'] = `${baseUrl}/${DEFAULT_LOCALE}/${path}`
  return {
    canonical: `${baseUrl}/${locale}/${path}`,
    languages
  }
}

function firstImageUrl(urls: string[] | null | undefined) {
  const u = urls?.[0]
  return u && u.trim().length > 0 ? u : null
}

export function generateFabricMetadata(fabric: FabricDetail): Metadata {
  const baseUrl = getSiteUrl()
  return generateFabricMetadataForLocale(fabric, 'ru')
}

export function generateFabricMetadataForLocale(fabric: FabricDetail, locale: Locale): Metadata {
  const baseUrl = getSiteUrl()
  const titleBase = getLocalizedFabricTitle(fabric, locale)

  const title =
    locale !== 'en' && fabric.metaTitleRu?.trim()
      ? fabric.metaTitleRu.trim()
      : `${titleBase} | TkanMarket`

  const descriptionBase =
    locale === 'en'
      ? (fabric.descriptionEn?.trim() ? fabric.descriptionEn : fabric.descriptionRu)
      : fabric.descriptionRu

  const description =
    locale !== 'en' && fabric.metaDescriptionRu?.trim()
      ? fabric.metaDescriptionRu.trim()
      : descriptionBase?.trim() || 'Wholesale fabric sourcing. Specs, MOQ and pricing.'

  // Locale-prefixed URL (matches the actual public route, e.g. /en/fabrics/slug).
  const url = `${baseUrl}/${locale}/fabrics/${fabric.slug}`
  const image = firstImageUrl(fabric.images)

  return {
    title,
    description,
    alternates: getFabricPageAlternates(fabric.slug, locale),
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: 'TkanMarket',
      locale,
      images: image ? [{ url: image }] : []
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : []
    }
  }
}

export function generateFabricJsonLd(fabric: FabricDetail): object {
  return generateFabricJsonLdForLocale(fabric, 'ru')
}

export function generateFabricJsonLdForLocale(fabric: FabricDetail, locale: Locale): object {
  const baseUrl = getSiteUrl()
  const name = getLocalizedFabricTitle(fabric, locale)
  const description =
    locale === 'en'
      ? (fabric.descriptionEn?.trim() ? fabric.descriptionEn : fabric.descriptionRu)
      : fabric.descriptionRu
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description ?? '',
    image: fabric.images ?? [],
    sku: fabric.sku ?? undefined
  }
}

/** WebSite + Organization graph for the localized home page (B2B marketplace). */
export function generateHomeWebSiteJsonLd(locale: Locale, homeTitle: string, homeDescription: string): object {
  const baseUrl = getSiteUrl()
  const url = `${baseUrl}/${locale}`
  const orgId = `${baseUrl}/#organization`
  /** Catalog search uses `q` (see fabrics catalog page). */
  const searchUrlTemplate = `${baseUrl}/${locale}/fabrics?q={search_term_string}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        url,
        name: homeTitle,
        description: homeDescription,
        publisher: { '@id': orgId },
        inLanguage: locale === 'en' ? 'en' : locale === 'ru' ? 'ru' : 'zh-CN',
        potentialAction: {
          '@type': 'SearchAction',
          target: searchUrlTemplate,
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'Organization',
        '@id': orgId,
        name: 'TkanMarket',
        url: baseUrl,
        description: homeDescription,
        logo: `${baseUrl}/og-placeholder.svg`
      }
    ]
  }
}

/** Schema.org `Article` JSON-LD for the public blog detail page. */
export function generateBlogArticleJsonLd(post: BlogPostDetail, locale: Locale): object {
  const baseUrl = getSiteUrl()
  const url = `${baseUrl}/${locale}/blog/${post.slug}`
  const wordCount = post.body
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean).length

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.heroImageUrl ? [post.heroImageUrl] : undefined,
    datePublished: post.createdAt,
    dateModified: post.createdAt,
    inLanguage: locale,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    articleSection: post.category ?? undefined,
    wordCount: wordCount > 0 ? wordCount : undefined,
    timeRequired: post.readMinutes != null ? `PT${post.readMinutes}M` : undefined,
    author: post.authorName
      ? {
          '@type': 'Person',
          name: post.authorName,
          jobTitle: post.authorRole ?? undefined
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'TkanMarket',
      url: baseUrl,
      logo: { '@type': 'ImageObject', url: `${baseUrl}/og-placeholder.svg` }
    }
  }
}

export function generateSupplierJsonLd(supplier: SupplierDetail): object {
  const baseUrl = getSiteUrl()
  const url = `${baseUrl}/suppliers/${supplier.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: supplier.name,
    url,
    logo: supplier.logoUrl ?? undefined,
    sameAs: supplier.websiteUrl ? [supplier.websiteUrl] : undefined,
    address: {
      '@type': 'PostalAddress',
      addressCountry: supplier.country,
      addressLocality: supplier.city ?? undefined,
      addressRegion: supplier.province ?? undefined
    }
  }
}

