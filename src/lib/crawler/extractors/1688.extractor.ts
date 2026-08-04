import type { PageLike } from '@/lib/crawler/browser'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function absUrl(href: string, base = 'https://detail.1688.com'): string | null {
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
  // 1688 / Alibaba Chinese security pages
  '验证码拦截', '验证码', '安全验证', '滑块验证', '人机验证', '风险拦截',
]

const LOGIN_INDICATORS = [
  'login', 'sign in', 'taobao', 'alipay', '请登录', '登录', '用户登录'
]

async function isBotPage(page: PageLike): Promise<boolean> {
  try {
    const t = await page.title()
    const u = page.url()
    return (
      BOT_INDICATORS.some((i) => t.includes(i)) ||
      u.includes('_____tmd_____') ||
      u.includes('/page/feedback?rand=')
    )
  } catch {
    return false
  }
}

async function isLoginPage(page: PageLike): Promise<boolean> {
  try {
    const t = await page.title()
    const u = page.url()
    return (
      LOGIN_INDICATORS.some((i) => t.includes(i)) ||
      u.includes('login') ||
      u.includes('member.1688.com') ||
      u.includes('login.taobao.com') ||
      u.includes('passport.1688.com')
    )
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function search1688WithPage(
  page: PageLike,
  keyword: string,
  maxPages: number
): Promise<string[]> {
  const q = encodeURIComponent(keyword)
  // 1688 search URL — keywords param, beginPage for pagination
  const startUrl = `https://s.1688.com/selloffer/offer_search.htm?keywords=${q}&scene=vertical_search`
  const urls: string[] = []

  for (let pageIdx = 0; pageIdx < Math.max(1, maxPages); pageIdx += 1) {
    const url = pageIdx === 0 ? startUrl : `${startUrl}&beginPage=${pageIdx + 1}`
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40_000 })
      await page.waitForLoadState('domcontentloaded', { timeout: 30_000 })
      // 1688 is an Alibaba SPA — needs time to hydrate
      await page.waitForTimeout(2500)

      const pageTitle = await page.title().catch(() => '')
      const pageCurrentUrl = page.url()
      logger.info('1688 search page loaded', { keyword, pageIdx, title: pageTitle, currentUrl: pageCurrentUrl })

      if (await isBotPage(page)) {
        logger.warn('1688 search bot-detection page', { keyword, pageIdx, title: pageTitle })
        break
      }
      if (await isLoginPage(page)) {
        logger.warn('1688 search redirected to login — set CRAWLER_SITE_COOKIES with 1688 session', { keyword, pageIdx, currentUrl: pageCurrentUrl })
        break
      }

      // Try multiple container selectors — 1688 revamps its classes frequently
      const containers = [
        '.sm-offer-list',
        '.offer-list',
        '[class*="offerlist"]',
        '[class*="offer-list"]',
        '[class*="grid-offer"]',
        'a[href*="/offer/"]'
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
        logger.warn('1688 search: no product container found', { keyword, pageIdx, title: pageTitle })
      }

      const hrefs = await page.$$eval('a[href]', (els) =>
        els
          .map((a) => (a instanceof HTMLAnchorElement ? a.getAttribute('href') ?? '' : ''))
          .filter(Boolean)
      )

      logger.info('1688 search hrefs collected', { keyword, pageIdx, totalHrefs: hrefs.length, sampleHrefs: hrefs.slice(0, 5) })

      const pageUrls = hrefs
        .map((h) => absUrl(h))
        .filter((u): u is string => u !== null)
        .filter(
          (u) =>
            (u.includes('1688.com') || u.includes('//')) &&
            u.includes('/offer/')
        )

      urls.push(...pageUrls)
      logger.info('1688 search product URLs found', { keyword, pageIdx, count: pageUrls.length })

      if (pageUrls.length === 0 && pageIdx === 0) {
        logger.warn('1688 search returned 0 product URLs on page 1', { keyword, url })
        break
      }
    } catch (err) {
      logger.warn('1688 search page failed', {
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

export async function scrape1688Product(
  page: PageLike,
  url: string
): Promise<ScrapedProduct | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40_000 })
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 })
    // 1688 SPA needs extra time after domcontentloaded
    await page.waitForTimeout(2500)
  } catch {
    return null
  }

  if (await isBotPage(page)) {
    logger.warn('1688 product bot-detection page', { url })
    return null
  }
  if (await isLoginPage(page)) {
    logger.warn('1688 product redirected to login', { url })
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

    // ── window.__INIT_DATA__ / window.detailData (1688-specific SPA state) ─
    let spaData: Record<string, unknown> | null = null
    try {
      const win = window as unknown as Record<string, unknown>
      const raw = win['__INIT_DATA__'] ?? win['detailData'] ?? win['pageData']
      if (raw && typeof raw === 'object') spaData = raw as Record<string, unknown>
    } catch { /* ignore */ }

    // ── Title ──────────────────────────────────────────────────────────────
    const spaTitle = (() => {
      try {
        const d = spaData as Record<string, unknown> | null
        const subject = d?.subject ?? (d?.data as Record<string, unknown>)?.subject
        return typeof subject === 'string' ? subject.trim() : null
      } catch { return null }
    })()

    const title =
      spaTitle ||
      (jsonLd?.name as string | undefined)?.trim() ||
      getMeta('og:title') ||
      getText(
        'h1.d-title',
        'h1[class*="title"]',
        '.d-title',
        '.mod-detail-title h1',
        '[class*="offerdetail"] h1',
        '#offerdetail-title h1',
        '.title-text',
        'h1'
      ) ||
      document.title?.trim() ||
      null

    // ── Description ────────────────────────────────────────────────────────
    const description =
      (jsonLd?.description as string | undefined)?.trim() ||
      getMeta('og:description', 'description') ||
      getText(
        '.d-desc',
        '.desc-word',
        '.mod-detail-desc',
        '[class*="desc-content"]',
        '.detail-desc',
        '#mod-detail-description',
        '[class*="description"]'
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
    // 1688 lazy-loads images into data-src
    const domImages = Array.from(document.querySelectorAll('img[src], img[data-src]'))
      .map((img) => img.getAttribute('src') ?? img.getAttribute('data-src') ?? '')
      .filter((s) => s && !s.includes('data:') && !s.includes('placeholder'))
    const imageUrls = [...new Set([
      ...(ogImage ? [ogImage] : []),
      ...jsonLdImages,
      ...domImages
    ])].map((u) => u.startsWith('//') ? `https:${u}` : u)

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
        '.d-price .price',
        '[class*="price-text"]',
        '[class*="priceNum"]',
        '.price-range',
        '[class*="priceRange"]',
        '.value',
        '[class*="price"]',
        '.price'
      ) ||
      null

    // ── MOQ ────────────────────────────────────────────────────────────────
    const moqText =
      getText(
        '.d-order-quantity',
        '[class*="order-quantity"]',
        '[class*="minOrder"]',
        '[class*="min-order"]',
        '.min-order',
        '[class*="moq"]'
      ) || null

    // ── Supplier ───────────────────────────────────────────────────────────
    const supplierName =
      getText(
        '.company-name-container',
        '.subj-name',
        '[class*="company-name"]',
        '.company-name',
        '[class*="supplier-name"]',
        '.shop-name'
      ) || null

    const supplierAnchor = document.querySelector(
      'a[href*="shop.1688.com"], a[href*="/company/"], a[href*="supplier"]'
    ) as HTMLAnchorElement | null
    const supplierUrl = supplierAnchor?.href ?? null

    return { title, description, imageUrls, priceText, moqText, supplierName, supplierUrl }
  })

  if (!extracted.title) return null

  // Regex extraction from raw HTML (more reliable for composition/GSM/width)
  const body = await page.content()

  // 1688 uses Chinese fabric composition patterns
  const compositionText =
    body.match(/\b(\d{1,3}\s*%\s*[A-Za-zА-Яа-я\u4e00-\u9fff]+(?:\s+\d{1,3}\s*%\s*[A-Za-zА-Яа-я\u4e00-\u9fff]+)*)\b/)?.[0] ??
    body.match(/(棉|涤纶|锦纶|腈纶|氨纶|麻|丝|羊毛|化纤)[^<]{0,60}(\d{1,3}\s*%)/)?.[0] ??
    null

  const gsmText =
    body.match(/(\d{2,4}\s*(gsm|g\/m²|g\/m2|克\/平方米|克每平方米|g\/㎡))/i)?.[0] ?? null

  const widthText =
    body.match(/(\d{2,4}\s*(cm|厘米|mm|毫米|英寸|inch|in)\b)/i)?.[0] ?? null

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
