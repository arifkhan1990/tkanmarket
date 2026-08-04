function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim()
}

function ensureHttps(url: string): string {
  const u = url.trim()
  if (u.startsWith('//')) return `https:${u}`
  if (u.startsWith('http://')) return `https://${u.slice('http://'.length)}`
  return u
}

function uniq(values: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of values) {
    const t = v.trim()
    if (!t) continue
    if (seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

function parseFirstNumber(input: string | null): number | null {
  if (!input) return null
  const m = input.replace(/,/g, '').match(/(\d+(\.\d+)?)/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

function envRate(name: string, fallback: number): number {
  const v = Number(process.env[name])
  return Number.isFinite(v) && v > 0 ? v : fallback
}

export type RawScrapedProduct = {
  url: string
  source: 'alibaba' | '1688' | 'made_in_china'
  sourceLanguage: 'en' | 'zh'
  title: string
  description: string | null
  imageUrls: string[]
  priceText: string | null
  moqText: string | null
  compositionText: string | null
  gsmText: string | null
  widthText: string | null
  supplierName: string | null
  supplierUrl: string | null
}

export type CleanedProductData = {
  rawTitle: string
  rawDescription: string | null
  images: string[]
  priceUsd: string | null
  moq: number | null
  rawComposition: string | null
  gsmRaw: string | null
  widthRaw: string | null
  sourceUrl: string
  source: 'alibaba' | '1688' | 'made_in_china'
  sourceLanguage: 'en' | 'zh'
  supplierName: string | null
  supplierUrl: string | null
}

export function cleanProductData(raw: RawScrapedProduct): CleanedProductData {
  const title = normalizeWhitespace(stripHtml(raw.title)).slice(0, 500) || 'Raw fabric'
  const description = raw.description ? normalizeWhitespace(stripHtml(raw.description)).slice(0, 5000) : null
  const images = uniq(raw.imageUrls.map(ensureHttps))
    .filter((u) => u.length >= 20)
    .slice(0, 10)

  const moq = parseFirstNumber(raw.moqText)

  const priceRaw = parseFirstNumber(raw.priceText)
  const cnyToUsd = envRate('CRAWLER_CNY_TO_USD_RATE', 0.14)
  const priceNumber =
    priceRaw === null ? null : raw.source === '1688' ? priceRaw * cnyToUsd : priceRaw
  const priceUsd = priceNumber === null ? null : priceNumber.toFixed(2)

  return {
    rawTitle: title,
    rawDescription: description,
    images,
    priceUsd,
    moq: moq === null ? null : Math.floor(moq),
    rawComposition: raw.compositionText ? normalizeWhitespace(stripHtml(raw.compositionText)).slice(0, 500) : null,
    gsmRaw: raw.gsmText ? normalizeWhitespace(stripHtml(raw.gsmText)).slice(0, 120) : null,
    widthRaw: raw.widthText ? normalizeWhitespace(stripHtml(raw.widthText)).slice(0, 120) : null,
    sourceUrl: raw.url,
    source: raw.source,
    sourceLanguage: raw.sourceLanguage,
    supplierName: raw.supplierName ? normalizeWhitespace(stripHtml(raw.supplierName)).slice(0, 240) : null,
    supplierUrl: raw.supplierUrl ? ensureHttps(raw.supplierUrl).slice(0, 1000) : null
  }
}

