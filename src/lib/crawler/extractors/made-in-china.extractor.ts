import type { PageLike } from '@/lib/crawler/browser'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function absUrl(href: string, base = 'https://www.made-in-china.com'): string | null {
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
  // MIC-specific error pages
  'information is not available', 'page not found', '404',
]

async function isBotOrErrorPage(page: PageLike): Promise<boolean> {
  try {
    const t = (await page.title()).toLowerCase()
    return BOT_INDICATORS.some((i) => t.includes(i))
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchMadeInChinaWithPage(
  page: PageLike,
  keyword: string,
  maxPages: number
): Promise<string[]> {
  const q = encodeURIComponent(keyword)
  // Legacy productdirectory URL — works without login for broader crawling
  const startUrl = `https://www.made-in-china.com/productdirectory.do?word=${q}&subaction=hunt&mode=and&order=0&style=b`
  const urls: string[] = []

  for (let pageIdx = 0; pageIdx < Math.max(1, maxPages); pageIdx += 1) {
    const url = pageIdx === 0 ? startUrl : `${startUrl}&curPage=${pageIdx + 1}`
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40_000 })
      await page.waitForLoadState('domcontentloaded', { timeout: 30_000 })
      // MIC uses server-rendered pages but still needs settling time
      await page.waitForTimeout(2000)

      const pageTitle = await page.title().catch(() => '')
      const pageCurrentUrl = page.url()
      logger.info('Made-in-China search page loaded', { keyword, pageIdx, title: pageTitle, currentUrl: pageCurrentUrl })

      if (await isBotOrErrorPage(page)) {
        logger.warn('Made-in-China search blocked or error page', { keyword, pageIdx, title: pageTitle })
        break
      }

      // Try multiple container selectors
      const containers = [
        '.sr-main',
        '.list_result',
        '.sr-proMain',
        '[class*="product-list"]',
        '[class*="search-list"]',
        'a[href*="/product/"]'
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
        logger.warn('Made-in-China search: no product container found', { keyword, pageIdx, title: pageTitle })
      }

      const hrefs = await page.$$eval('a[href]', (els) =>
        els
          .map((a) => (a instanceof HTMLAnchorElement ? a.getAttribute('href') ?? '' : ''))
          .filter(Boolean)
      )
      logger.info('Made-in-China search hrefs collected', { keyword, pageIdx, totalHrefs: hrefs.length, sampleHrefs: hrefs.slice(0, 5) })

      const pageUrls = hrefs
        .map((h) => absUrl(h))
        .filter((u): u is string => u !== null)
        .filter(
          (u) =>
            u.includes('made-in-china.com') &&
            (u.includes('/product/') || u.includes('/showpic/'))
        )

      urls.push(...pageUrls)
      logger.info('Made-in-China search product URLs found', { keyword, pageIdx, count: pageUrls.length })

      if (pageUrls.length === 0 && pageIdx === 0) {
        logger.warn('Made-in-China search returned 0 product URLs on page 1', { keyword, url })
        break
      }
    } catch (err) {
      logger.warn('Made-in-China search page failed', {
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

export async function scrapeMadeInChinaProduct(
  page: PageLike,
  url: string
): Promise<ScrapedProduct | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40_000 })
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 })
    // MIC product pages load extra JS after initial render
    await page.waitForTimeout(2500)
  } catch {
    return null
  }

  if (await isBotOrErrorPage(page)) {
    logger.warn('Made-in-China product bot-detection page', { url })
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
    specComposition: string | null
    specGsm: string | null
    specWidth: string | null
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

    const flattenTypes = (t: unknown): string[] => {
      if (t == null) return []
      if (typeof t === 'string') return [t]
      if (Array.isArray(t)) return t.filter((x): x is string => typeof x === 'string')
      return []
    }

    const nameFromOrg = (o: unknown): string | null => {
      if (!o || typeof o !== 'object') return null
      const r = o as Record<string, unknown>
      if (typeof r.name === 'string' && r.name.trim()) return r.name.trim()
      return null
    }

    const allLdNodes: Record<string, unknown>[] = (() => {
      const out: Record<string, unknown>[] = []
      for (const script of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
        try {
          const data = JSON.parse(script.textContent ?? '') as unknown
          const push = (d: unknown) => {
            if (d && typeof d === 'object' && !Array.isArray(d)) {
              out.push(d as Record<string, unknown>)
            }
          }
          if (data && typeof data === 'object' && !Array.isArray(data) && (data as Record<string, unknown>)['@graph']) {
            const g = (data as Record<string, unknown>)['@graph']
            if (Array.isArray(g)) {
              for (const item of g) push(item)
            }
          } else if (Array.isArray(data)) {
            for (const item of data) push(item)
          } else {
            push(data)
          }
        } catch { /* ignore */ }
      }
      return out
    })()

    // ── JSON-LD: prefer Product, merge brand / manufacturer / seller ─────
    let jsonLd: Record<string, unknown> | null = null
    for (const node of allLdNodes) {
      const types = flattenTypes(node['@type'])
      if (types.includes('Product') || typeof node.name === 'string') {
        jsonLd = node
        break
      }
    }
    if (!jsonLd && allLdNodes[0]) jsonLd = allLdNodes[0]

    const orgNameFromJsonLd = (): string | null => {
      for (const node of allLdNodes) {
        const types = flattenTypes(node['@type'])
        if (types.some((t) => /organization|localbusiness|store|brand/i.test(t))) {
          const n = nameFromOrg(node)
          if (n) return n
        }
      }
      if (!jsonLd) return null
      const b = (jsonLd as Record<string, unknown>).brand
      if (typeof b === 'string' && b.trim()) return b.trim()
      if (b && typeof b === 'object') {
        const n = nameFromOrg(b)
        if (n) return n
      }
      const m = (jsonLd as Record<string, unknown>).manufacturer
      if (m && typeof m === 'object') {
        const n = nameFromOrg(m)
        if (n) return n
      }
      const offers = (jsonLd as Record<string, unknown>).offers
      if (offers && typeof offers === 'object') {
        const o = offers as Record<string, unknown>
        const seller = o.seller
        if (seller && typeof seller === 'object') {
          const n = nameFromOrg(seller)
          if (n) return n
        }
      }
      return null
    }

    // ── Title ──────────────────────────────────────────────────────────────
    const title =
      (jsonLd?.name as string | undefined)?.trim() ||
      getMeta('og:title') ||
      getText(
        'h1.product-name',
        'h1.proName',
        'h1[class*="product-title"]',
        'h1[class*="pro-name"]',
        '.product-info h1',
        '.pro-title h1',
        '[class*="product-title"]',
        'h1'
      ) ||
      document.title?.trim() ||
      null

    // ── Description ────────────────────────────────────────────────────────
    const description =
      (jsonLd?.description as string | undefined)?.trim() ||
      getMeta('og:description', 'description') ||
      getText(
        '.product-description',
        '.pro-description',
        '.des',
        '#product-desc',
        '[class*="product-detail"]',
        '[class*="pro-detail"]',
        '.detail-content',
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
    // MIC uses data-original for lazy images
    const domImages = Array.from(
      document.querySelectorAll('img[src], img[data-original], img[data-src]')
    )
      .map((img) =>
        img.getAttribute('src') ??
        img.getAttribute('data-original') ??
        img.getAttribute('data-src') ??
        ''
      )
      .filter((s) => s && !s.includes('data:') && !s.includes('placeholder') && !s.includes('blank'))
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
        '[class*="price-info"]',
        '[class*="price-range"]',
        '.price-content',
        '.pro-price',
        '[class*="price"]',
        '.price'
      ) ||
      null

    // ── MOQ ────────────────────────────────────────────────────────────────
    const moqText =
      getText(
        '[class*="min-order"]',
        '[class*="minOrder"]',
        '[class*="moq"]',
        '.moq',
        '.min-order',
        '[class*="MOQ"]',
        '[class*="min_order"]'
      ) || null

    // ── Supplier: JSON-LD + product sidebar / legacy + showroom links ─────
    const bestCompanyUrl = ((): { href: string; text: string } | null => {
      const isMicCompany = (href: string) =>
        /made-in-china\.com/i.test(href) &&
        (href.includes('/showroom/') ||
          href.includes('co_show') ||
          href.includes('/company/') ||
          href.includes('manufacturer') ||
          /\.[a-z0-9-]+\.en\.made-in-china\.com/i.test(href) ||
          /\.[a-z0-9-]+\.made-in-china\.com/i.test(href))

      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]')).filter(
        (a) => a.href && isMicCompany(a.href) && !a.href.includes('javascript:')
      )
      if (links.length === 0) return null
      const score = (a: HTMLAnchorElement) => {
        let s = 0
        if (a.href.includes('/showroom/')) s += 5
        if (/\.[a-z0-9-]+\.en\.made-in-china\.com/i.test(a.href)) s += 4
        if (a.href.includes('co_show')) s += 3
        if (a.href.includes('/company/')) s += 2
        const t = a.textContent?.trim() ?? ''
        if (t.length > 1 && t.length < 200) s += 1
        return s
      }
      const sorted = links.sort((a, b) => score(b) - score(a))
      const first = sorted[0]
      if (!first) return null
      const t = first.textContent?.replace(/\s+/g, ' ').trim() ?? ''
      return { href: first.href, text: t }
    })()

    const supplierNameDom =
      getText(
        '.company-name',
        '.sr-comName',
        '.sr-ctCompanyName',
        '[class*="CompanyName"]',
        '[class*="company-name"]',
        '[class*="supplier-name"]',
        '[class*="comp-name"]',
        '[class*="ComName"]',
        '.com-name a',
        'a[class*="company"]',
        'header [class*="supplier"]',
        'aside [class*="company"]'
      ) ||
      (bestCompanyUrl && bestCompanyUrl.text.length > 0 ? bestCompanyUrl.text : null) ||
      null

    const jsonLdOrgName = orgNameFromJsonLd()
    const supplierName = [jsonLdOrgName, supplierNameDom].find((n) => n && n.length > 0) || null

    const supplierFromAnchor = document.querySelector(
      'a[href*="/showroom/"], a[href*="co_show"], a[href*="/company/"], a[href*="manufacturer"]'
    ) as HTMLAnchorElement | null
    const supplierSubdomain = document.querySelector(
      'a[href*=".en.made-in-china.com"], a[href*=".made-in-china.com"]'
    ) as HTMLAnchorElement | null
    const supplierUrl =
      (bestCompanyUrl && bestCompanyUrl.href ? bestCompanyUrl.href : null) ||
      supplierFromAnchor?.href ||
      supplierSubdomain?.href ||
      null

    const specRow = (labelHints: string[]): string | null => {
      for (const tr of Array.from(document.querySelectorAll('tr'))) {
        const rowText = (tr.textContent ?? '').toLowerCase()
        if (!labelHints.some((h) => rowText.includes(h))) continue
        const cells = tr.querySelectorAll('td, th')
        if (cells.length >= 2) {
          const v = cells[cells.length - 1]?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
          if (v && v.length < 2000) return v
        } else {
          const only = tr.querySelector('td,th')?.textContent?.replace(/\s+/g, ' ').trim()
          if (only && only.includes(':')) {
            const part = only.split(':').pop()?.trim()
            if (part) return part
          }
        }
      }
      for (const dl of Array.from(document.querySelectorAll('dl'))) {
        const dts = dl.querySelectorAll('dt')
        for (const dt of Array.from(dts)) {
          const l = (dt.textContent ?? '').toLowerCase()
          if (!labelHints.some((h) => l.includes(h))) continue
          const dd = dt.nextElementSibling
          const v = dd?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
          if (v) return v
        }
      }
      return null
    }

    const specComposition = specRow(['composition', 'content', 'material', 'fabric', 'ingredient', 'constituent'])
    const specGsm = specRow(['gram weight', 'grammage', 'weight', 'gsm', 'g/m2', 'g / m2', 'g/m²', 'g / m'])
    const specWidth = specRow(['width', 'breadth', '门幅', '幅宽', '有效幅宽', '全幅'])

    return {
      title,
      description,
      imageUrls,
      priceText,
      moqText,
      supplierName,
      supplierUrl,
      specComposition,
      specGsm,
      specWidth
    }
  })

  if (!extracted.title) return null

  // Regex extraction from raw HTML (fallback if table/specs missing)
  const body = await page.content()
  const compositionText =
    extracted.specComposition?.trim() ||
    body.match(/\b(\d{1,3}\s*%\s*[A-Za-zА-Яа-я]+(?:\s+\d{1,3}\s*%\s*[A-Za-zА-Яа-я]+)*)\b/)?.[0] ||
    null
  const gsmText =
    extracted.specGsm?.trim() || body.match(/(\d{2,4}\s*(gsm|g\/m²|g\/m2|grams))/i)?.[0] || null
  const widthText =
    extracted.specWidth?.trim() ||
    body.match(/(\d{2,4}\s*(cm|мм|mm|inches|inch|in)\b)/i)?.[0] ||
    null

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

function isEnrichableMicShowroomUrl(companyUrl: string): boolean {
  try {
    const u = new URL(companyUrl)
    if (!/made-in-china\.com$/i.test(u.hostname) && !u.hostname.includes('made-in-china.com')) {
      return false
    }
    if (u.hostname === 'www.made-in-china.com' && (u.pathname === '/' || u.pathname === '/index.html')) {
      return false
    }
    if (u.pathname === '/' && (u.hostname === 'www.made-in-china.com' || u.hostname === 'made-in-china.com')) {
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Visits a showroom / company URL (usually *.en.made-in-china.com) to fill name, address, logo, website.
 * Called for each new draft supplier in discovery; safe to return null on layout changes.
 */
export async function enrichMadeInChinaSupplierProfile(
  page: PageLike,
  companyUrl: string
): Promise<{
  name: string | null
  logoUrl: string | null
  websiteUrl: string | null
  city: string | null
  province: string | null
  establishedYear: number | null
} | null> {
  if (!isEnrichableMicShowroomUrl(companyUrl)) {
    return null
  }
  try {
    await page.goto(companyUrl, { waitUntil: 'domcontentloaded', timeout: 40_000 })
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 })
    await page.waitForTimeout(2000)
  } catch (err) {
    logger.warn('Made-in-China supplier profile: goto failed', {
      companyUrl,
      message: err instanceof Error ? err.message : String(err)
    })
    return null
  }

  if (await isBotOrErrorPage(page)) {
    logger.warn('Made-in-China supplier profile: blocked or error page', { companyUrl })
    return null
  }

  const data = await page.evaluate((): {
    name: string | null
    logoUrl: string | null
    websiteUrl: string | null
    addressLine: string | null
    establishedYear: number | null
  } => {
    const getText = (...sels: string[]): string | null => {
      for (const s of sels) {
        try {
          const el = document.querySelector(s)
          const t = el?.textContent?.replace(/\s+/g, ' ').trim()
          if (t) return t
        } catch { /* skip */ }
      }
      return null
    }

    const getMeta = (prop: string, name: string) =>
      document.querySelector(`meta[property="${prop}"]`)?.getAttribute('content')?.trim() ||
      document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim() ||
      null

    const nameFromDom =
      getText(
        'h1.companyName',
        'h1[class*="showroom"]',
        'h1.co-name',
        'h1[class*="CompanyName"]',
        'h1.company',
        'h1',
        '.companyName',
        'header .company h2',
        '[class*="showroomName"]',
        'title'
      ) || getMeta('og:title', 'og:title') || null

    const name =
      nameFromDom && !/made-in-china|product|showroom|china supplier/i.test(nameFromDom) ? nameFromDom : getText('h1')

    const logoFromImg = (() => {
      const imgs = document.querySelectorAll<HTMLImageElement>(
        'img[src*="logo"], .logo img, .companyLogo img, .comp-logo img, header .logo img'
      )
      for (const img of Array.from(imgs)) {
        const s = img.getAttribute('src') ?? img.getAttribute('data-original') ?? ''
        if (s && s.startsWith('http') && !s.includes('icon')) return s
      }
      return null
    })()

    const websiteUrl = (() => {
      const a = document.querySelector(
        'a[rel*="nofollow"][href^="http"]:not([href*="made-in-china.com"])'
      ) as HTMLAnchorElement | null
      if (a?.href) return a.href
      for (const tr of Array.from(document.querySelectorAll('tr'))) {
        const t = (tr.textContent ?? '').toLowerCase()
        if (!t.includes('website') && !t.includes('http')) continue
        const link = tr.querySelector<HTMLAnchorElement>('a[href^="http"]')
        if (link?.href && !link.href.includes('made-in-china.com')) return link.href
      }
      return null
    })()

    const addressLine = getText(
      '[class*="co-address"]',
      '[class*="address"]',
      '.addr',
      '[class*="location"]',
      'address',
      'footer [class*="addr"]'
    )

    const bodyText = document.body?.innerText ?? ''
    let y: number | null = null
    const m1 = bodyText.match(/(?:established|est\.|founded|since|year\s+established)\s*[:]?\s*(19|20)\d{2}/i)
    if (m1) y = parseInt(m1[0].match(/(19|20)\d{2}/)?.[0] ?? '', 10)
    if (y == null) {
      const m2 = bodyText.match(/\b(19|20)\d{2}\b/g)
      if (m2) {
        const asNum = m2.map((x) => parseInt(x, 10)).filter((n) => n >= 1980 && n <= new Date().getFullYear())
        if (asNum.length > 0) y = asNum[0] ?? null
      }
    }

    return {
      name: name?.split('|')[0]?.trim() ?? name,
      logoUrl: logoFromImg,
      websiteUrl,
      addressLine,
      establishedYear: y
    }
  })

  if (!data) return null

  let city: string | null = null
  let province: string | null = null
  if (data.addressLine) {
    const parts = data.addressLine.split(/[,，]/).map((p) => p.trim()).filter(Boolean)
    if (parts.length >= 2) {
      province = parts[parts.length - 2] ?? null
      city = parts[parts.length - 1] ?? null
    } else {
      city = data.addressLine
    }
  }

  return {
    name: data.name,
    logoUrl: data.logoUrl,
    websiteUrl: data.websiteUrl,
    city,
    province,
    establishedYear: data.establishedYear
  }
}
