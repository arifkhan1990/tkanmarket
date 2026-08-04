import crypto from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import { logger } from '@/lib/logger'
import { proxyFromEnv, proxyLogMeta, type CrawlerProxyConfig } from '@/lib/crawler/proxy-rotation'
import { getSiteCookies, type CookieLike } from '@/lib/crawler/site-cookies'
import { hardenPage, pickUserAgent, randomViewport } from '@/lib/crawler/page-hardening'
import { installRequestBlocking } from '@/lib/crawler/request-blocker'

type Semaphore = {
  acquire(): Promise<() => void>
}

function createSemaphore(max: number): Semaphore {
  let available = max
  const waiters: Array<(release: () => void) => void> = []

  function release() {
    available += 1
    const next = waiters.shift()
    if (next) {
      available -= 1
      next(release)
    }
  }

  async function acquire(): Promise<() => void> {
    if (available > 0) {
      available -= 1
      return release
    }
    return new Promise<() => void>((resolve) => {
      waiters.push(resolve)
    })
  }

  return { acquire }
}

type BrowserLike = {
  newContext(options?: {
    userAgent?: string
    viewport?: { width: number; height: number }
    proxy?: CrawlerProxyConfig
  }): Promise<BrowserContextLike>
  close(): Promise<void>
  isConnected(): boolean
}

type BrowserContextLike = {
  newPage(): Promise<PageLike>
  addCookies(cookies: CookieLike[]): Promise<void>
  close(): Promise<void>
}

export type PageLike = {
  goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeout?: number }): Promise<void>
  waitForLoadState(state?: 'load' | 'domcontentloaded' | 'networkidle', options?: { timeout?: number }): Promise<void>
  waitForTimeout(ms: number): Promise<void>
  url(): string
  addInitScript(script: () => void): Promise<void>
  setExtraHTTPHeaders(headers: Record<string, string>): Promise<void>
  title(): Promise<string>
  textContent(selector: string): Promise<string | null>
  content(): Promise<string>
  evaluate<T>(pageFunction: () => T): Promise<T>
  $$eval<T>(selector: string, pageFunction: (elements: Element[]) => T): Promise<T>
  locator(selector: string): { first(): { waitFor(options?: { timeout?: number }): Promise<void> } }
}

type PlaywrightLike = {
  chromium: {
    launch(options: { headless: boolean; args?: string[] }): Promise<BrowserLike>
  }
}

function envInt(name: string, fallback: number): number {
  const v = Number(process.env[name])
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback
}

/** Walk up from `startDir` to find the repo root (directory with package.json). */
function findPackageJsonRoot(startDir: string): string {
  let dir = path.resolve(startDir)
  for (let depth = 0; depth < 40; depth++) {
    if (existsSync(path.join(dir, 'package.json'))) {
      return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return path.resolve(process.cwd())
}

/** Prefer project root (pnpm workspace) over nested package.json (e.g. under node_modules). */
function findTkanmarketRoot(startDir: string): string {
  let dir = path.resolve(startDir)
  for (let depth = 0; depth < 40; depth++) {
    const pkgPath = path.join(dir, 'package.json')
    if (existsSync(pkgPath)) {
      try {
        const raw = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string }
        if (raw.name === 'tkanmarket') return dir
      } catch {
        /* ignore invalid package.json */
      }
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return findPackageJsonRoot(startDir)
}

/**
 * Where to start searching for repo root: worker entry script dir (dist-workers/.../workers)
 * falls back to cwd (Next dev / API).
 */
function crawlerResolutionStartDir(): string {
  const mainScript = process.argv[1]
  if (mainScript && (path.isAbsolute(mainScript) || mainScript.startsWith('.'))) {
    return path.dirname(path.resolve(mainScript))
  }
  return process.cwd()
}

let playwrightRequire: ReturnType<typeof createRequire> | null = null

function getProjectRequireForPlaywright(): ReturnType<typeof createRequire> {
  if (playwrightRequire) return playwrightRequire
  const root = findTkanmarketRoot(crawlerResolutionStartDir())
  playwrightRequire = createRequire(path.join(root, 'package.json'))
  return playwrightRequire
}

async function requirePlaywright(): Promise<PlaywrightLike> {
  try {
    return getProjectRequireForPlaywright()('playwright') as PlaywrightLike
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Playwright failed to load (${detail}). Run from repo root, ensure "playwright" is in dependencies, then: pnpm run playwright:install`
    )
  }
}

let browserSingleton: BrowserLike | null = null
const pageSemaphore = createSemaphore(envInt('CRAWLER_MAX_CONCURRENT_PAGES', 3))

export async function humanDelay(minMs?: number, maxMs?: number): Promise<void> {
  const min = Math.max(0, minMs ?? envInt('CRAWLER_REQUEST_DELAY_MIN', 1500))
  const max = Math.max(min, maxMs ?? envInt('CRAWLER_REQUEST_DELAY_MAX', 4000))
  const ms = crypto.randomInt(min, max + 1)
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function createBrowser(): Promise<BrowserLike> {
  const pw = await requirePlaywright()
  const args = [
    '--disable-blink-features=AutomationControlled',
    '--no-sandbox',
    '--disable-dev-shm-usage'
  ]
  return pw.chromium.launch({ headless: true, args })
}

export async function getBrowser(): Promise<BrowserLike> {
  if (browserSingleton && browserSingleton.isConnected()) return browserSingleton
  browserSingleton = await createBrowser()
  return browserSingleton
}

export async function closeBrowser(): Promise<void> {
  if (!browserSingleton) return
  try {
    await browserSingleton.close()
  } finally {
    browserSingleton = null
  }
}

export async function getPage(): Promise<{ page: PageLike; release: () => Promise<void> }> {
  const releaseSlot = await pageSemaphore.acquire()
  const browser = await getBrowser()

  const proxy = proxyFromEnv()
  if (proxy) {
    logger.info('Crawler using proxy', proxyLogMeta(proxy))
  }

  const ctx = await browser.newContext({
    userAgent: pickUserAgent(),
    viewport: randomViewport(),
    proxy,
  })

  // Inject site cookies (e.g. 1688 session) — Playwright automatically
  // filters cookies by domain so irrelevant cookies are harmless.
  const siteCookies = getSiteCookies()
  if (siteCookies.length > 0) {
    try {
      await ctx.addCookies(siteCookies)
      logger.info('Site cookies injected', { count: siteCookies.length })
    } catch (err) {
      logger.warn('Failed to inject site cookies', { message: err instanceof Error ? err.message : String(err) })
    }
  }

  const page = await ctx.newPage()
  await installRequestBlocking(page)
  await hardenPage(page)

  const release = async () => {
    try {
      await ctx.close()
    } catch (err) {
      logger.warn('Crawler context close failed', { message: err instanceof Error ? err.message : String(err) })
    } finally {
      releaseSlot()
    }
  }

  return { page, release }
}

