import type { PageLike } from '@/lib/crawler/browser'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function absUrl(href: string, base = 'https://www.alibaba.com'): string | null {
  const v = href.trim()
  if (!v) return null
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  if (v.startsWith('//')) return `https:${v}`
  if (v.startsWith('/')) return `${base}${v}`
  return null
}

function uniq(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of values) {
    const t = v.trim()
    if (t && !seen.has(t)) { seen.add(t); out.push(t) }
  }
  return out
}

const BOT_INDICATORS = [
  'robot', 'captcha', 'verify', 'access denied', 'blocked',
  'just a moment', 'ddos-guard', 'cloudflare', 'security check',
  '403 forbidden', 'too many requests',
  // Alibaba Chinese CAPTCHA pages
  '验证码拦截', '验证码', '安全验证', '滑块验证', '人机验证',
  // Alibaba TMD (security intercept) pages
  '_____tmd_____', 'tmd'
]

async function isBotPage(page: PageLike): Promise<boolean> {
  try {
    const t = (await page.title()).toLowerCase()
    const u = page.url()
    return (
      BOT_INDICATORS.some((i) => t.includes(i.toLowerCase())) ||
      u.includes('_____tmd_____') ||
      u.includes('/page/feedback?rand=')
    )
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchAlibabaWithPage(
  page: PageLike,
  keyword: string,
  maxPages: number
): Promise<string[]> {
  const q = encodeURIComponent(keyword)
  // Both URL variants are tried — Alibaba uses different routes by region
  const startUrl = `https://www.alibaba.com/trade/search?SearchText=${q}&IndexArea=product_en`
  const urls: string[] = []

  for (let pageIdx = 0; pageIdx < Math.max(1, maxPages); pageIdx += 1) {
    const url = pageIdx === 0 ? startUrl : `${startUrl}&page=${pageIdx + 1}`
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40_000 })
      await page.waitForLoadState('domcontentloaded', { timeout: 30_000 })
      // Alibaba is a React SPA — give it time to hydrate product cards
      await page.waitForTimeout(2500)

      const pageTitle = await page.title().catch(() => '')
      const pageCurrentUrl = page.url()
      logger.info('Alibaba search page loaded', { keyword, pageIdx, title: pageTitle, currentUrl: pageCurrentUrl })

      if (await isBotPage(page)) {
        logger.warn('Alibaba search bot-detection page', { keyword, pageIdx, title: pageTitle })
        break
      }

      // Wait for any product card container — try current and legacy selectors
      const containers = [
        '.organic-gallery-offer-outter',
        '[class*="organic-offer"]',
        '.organic-list',
        '.m-gallery-product-item-v2',
        '[class*="product-item"]',
        'a[href*="/product-detail/"]'
      ]
      let found = false
      for (const sel of containers) {
        try {
          await page.locator(sel).first().waitFor({ timeout: 4_000 })
          found = true
          break
        } catch { /* try next */ }
      }
      if (!found) {
        logger.warn('Alibaba search: no product container found', { keyword, pageIdx, title: pageTitle })
        // Still continue — we may find product URLs in the raw hrefs
      }

      const hrefs = await page.$$eval('a[href]', (els) =>
        els
          .map((a) => (a instanceof HTMLAnchorElement ? a.getAttribute('href') ?? '' : ''))
          .filter(Boolean)
      )
      logger.info('Alibaba search hrefs collected', { keyword, pageIdx, totalHrefs: hrefs.length, sampleHrefs: hrefs.slice(0, 5) })

      const pageUrls = hrefs
        .map((h) => absUrl(h))
        .filter((u): u is string => u !== null)
        .filter(
          (u) =>
            (u.includes('alibaba.com') || u.includes('//')) &&
            u.includes('/product-detail/')
        )

      urls.push(...pageUrls)
      logger.info('Alibaba search product URLs found', { keyword, pageIdx, count: pageUrls.length })

      if (pageUrls.length === 0 && pageIdx === 0) {
        logger.warn('Alibaba search returned 0 product URLs on page 1', { keyword, url })
        break
      }
    } catch (err) {
      logger.warn('Alibaba search page failed', {
        keyword,
        pageIdx,
        message: err instanceof Error ? err.message : String(err)
      })
      break
    }
  }

  return uniq(urls)
}

// ---------------------------------------------------------------------------
// Product scrape
// ---------------------------------------------------------------------------

interface ScrapedProduct {
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
}

export async function scrapeAlibabaProduct(
  page: PageLike,
  url: string
): Promise<ScrapedProduct | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40_000 })
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 })
    // Alibaba SPA needs extra time after domcontentloaded
    await page.waitForTimeout(2500)
  } catch {
    return null
  }

  if (await isBotPage(page)) {
    logger.warn('Alibaba product bot-detection page', { url })
    return null
  }

  // Run all extraction inside the browser context for full DOM access
  const extracted = await page.evaluate((): {
    title: string | null
    description: string | null
    imageUrls: string[]
    priceText: string | null
    moqText: string | null
    supplierName: string | null
    supplierUrl: string | null
  } => {
    // ── Helpers ────────────────────────────────────────────────────────────
    const getText = (...selectors: string[]): string | null => {
      for (const sel of selectors) {
        try {
          const el = document.querySelector(sel)
          const t = el?.textContent?.trim()
          if (t) return t
        } catch { /* skip invalid selector */ }
      }
      return null
    }

    const getMeta = (...names: string[]): string | null => {
      for (const name of names) {
        const byProp = document.querySelector(`meta[property="${name}"]`)?.getAttribute('content')?.trim()
        if (byProp) return byProp
        const byName = document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim()
        if (byName) return byName
      }
      return null
    }

    // ── JSON-LD (most stable source) ───────────────────────────────────────
    let jsonLd: Record<string, unknown> | null = null
    for (const script of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
      try {
        const data = JSON.parse(script.textContent ?? '') as Record<string, unknown>
        if (data['@type'] === 'Product' || typeof data.name === 'string') {
          jsonLd = data
          break
        }
      } catch { /* ignore */ }
    }

    // ── Title ──────────────────────────────────────────────────────────────
    const title =
      (jsonLd?.name as string | undefined)?.trim() ||
      getMeta('og:title') ||
      // 2024 Alibaba selectors
      getText(
        'h1.module-pdp-titlePro-title',
        'h1[class*="title"]',
        'h1.product-title',
        'h1.d-title',
        '.module-pdp-title h1',
        '[class*="product-title"] h1',
        'h1'
      ) ||
      document.title?.trim() ||
      null

    // ── Description ────────────────────────────────────────────────────────
    const description =
      (jsonLd?.description as string | undefined)?.trim() ||
      getMeta('og:description', 'description') ||
      getText(
        '.module-pdp-description',
        '#desc_module .detail-desc-decorate-richtext',
        '.detail-desc-decorate-richtext',
        '.product-description',
        '[class*="description"]',
        '.overview',
        '#product_desc'
      ) ||
      null

    // ── Images ─────────────────────────────────────────────────────────────
    const ogImage = getMeta('og:image')
    const jsonLdImages: string[] = (() => {
      const img = jsonLd?.image
      if (!img) return []
      if (typeof img === 'string') return [img]
      if (Array.isArray(img)) return (img as unknown[]).filter((i): i is string => typeof i === 'string')
      return []
    })()
    const domImages = Array.from(document.querySelectorAll('img[src]'))
      .map((img) => img.getAttribute('src') ?? '')
      .filter(Boolean)
    const imageUrls = [...new Set([
      ...(ogImage ? [ogImage] : []),
      ...jsonLdImages,
      ...domImages
    ])]

    // ── Price ──────────────────────────────────────────────────────────────
    const offerPrice = (() => {
      const offers = jsonLd?.offers
      if (!offers || typeof offers !== 'object') return null
      const o = offers as Record<string, unknown>
      return o.price != null ? String(o.price) : null
    })()
    const priceText =
      offerPrice ||
      getMeta('product:price:amount') ||
      getText(
        '[class*="price-unit-origin"]',
        '[class*="price-current"]',
        '.price-range',
        '[class*="priceRange"]',
        '.d-price .price',
        '[class*="price"]',
        '.price'
      ) ||
      null

    // ── MOQ ────────────────────────────────────────────────────────────────
    const moqText =
      getText(
        '[class*="minOrderQuantity"]',
        '[class*="min-order"]',
        '[class*="order-quantity"]',
        '.moq',
        '[class*="moq"]',
        '.d-order-quantity'
      ) || null

    // ── Supplier ───────────────────────────────────────────────────────────
    const supplierName =
      getText(
        '[class*="company-name"]',
        '.company-name',
        '.supplier-name',
        '.ma-companyName',
        '[class*="supplier"]',
        '.subj-name'
      ) || null

    const supplierAnchor = document.querySelector(
      'a[href*="company"], a[href*="supplier"], a[href*="/companys/"]'
    ) as HTMLAnchorElement | null
    const supplierUrl = supplierAnchor?.href ?? null

    return { title, description, imageUrls, priceText, moqText, supplierName, supplierUrl }
  })

  if (!extracted.title) return null

  // Regex extraction from raw HTML (more reliable for composition/GSM/width)
  const body = await page.content()
  const compositionText =
    body.match(/\b(\d{1,3}\s*%\s*[A-Za-zА-Яа-я]+(?:\s+\d{1,3}\s*%\s*[A-Za-zА-Яа-я]+)*)\b/)?.[0] ?? null
  const gsmText =
    body.match(/(\d{2,4}\s*(gsm|g\/m²|g\/m2|grams))/i)?.[0] ?? null
  const widthText =
    body.match(/(\d{2,4}\s*(cm|мм|mm|inches|inch|in)\b)/i)?.[0] ?? null

  return {
    title: extracted.title,
    description: extracted.description,
    imageUrls: extracted.imageUrls,
    priceText: extracted.priceText,
    moqText: extracted.moqText,
    supplierName: extracted.supplierName,
    supplierUrl: extracted.supplierUrl,
    compositionText,
    gsmText,
    widthText
  }
}
