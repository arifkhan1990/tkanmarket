/**
 * Crawler proxy configuration from environment.
 * Supports standard URLs and provider "HOST:PORT:USER:PASS" lines (e.g. IPRoyal dashboard export).
 * Credentials are never logged; use Playwright `username`/`password` fields (not embedded in URL)
 * so special characters in passwords do not break parsing.
 */

import { logger } from '@/lib/logger'

export type CrawlerProxyConfig = {
  server: string
  username?: string
  password?: string
}

let proxyRoundRobinIdx = 0

function envTrim(name: string): string | undefined {
  const v = process.env[name]?.trim()
  return v ? v : undefined
}

function applyUsernameSuffix(username: string | undefined): string | undefined {
  const suffix = envTrim('CRAWLER_PROXY_USERNAME_SUFFIX')
  if (!suffix || !username) return username
  return `${username}${suffix}`
}

/**
 * Parse `http(s)://user:pass@host:port` or `socks5://...` into Playwright proxy fields.
 */
function parseProxyUrlString(raw: string): CrawlerProxyConfig | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const u = new URL(trimmed)
    if (!u.hostname) return null
    const protocol = u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'socks5:' ? u.protocol : 'http:'
    const defaultPort = protocol === 'https:' ? '443' : protocol === 'socks5:' ? '1080' : '80'
    const port = u.port || defaultPort
    const server = `${protocol}//${u.hostname}:${port}`
    const username = u.username ? decodeURIComponent(u.username) : undefined
    const password = u.password ? decodeURIComponent(u.password) : undefined
    return {
      server,
      username: applyUsernameSuffix(username),
      password
    }
  } catch {
    return null
  }
}

/**
 * Parse `host:port:username:password` (password may contain `:`).
 * IPv6 hosts are not supported (use CRAWLER_PROXY_URL instead).
 */
function parseHostPortUserPassLine(raw: string): CrawlerProxyConfig | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parts = trimmed.split(':')
  if (parts.length < 4) return null
  const host = parts[0]
  const port = parts[1]
  const username = parts[2]
  const password = parts.slice(3).join(':')
  if (!host || !port || !username) return null
  const proto = envTrim('CRAWLER_PROXY_PROTOCOL') ?? 'http'
  const protocol = proto === 'socks5' ? 'socks5:' : 'http:'
  return {
    server: `${protocol}//${host}:${port}`,
    username: applyUsernameSuffix(username),
    password: password.length > 0 ? password : undefined
  }
}

function parseProxyLine(raw: string): CrawlerProxyConfig | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const urlParsed = parseProxyUrlString(trimmed)
  if (urlParsed) return urlParsed
  return parseHostPortUserPassLine(trimmed)
}

function collectProxyLines(): string[] {
  const multi = envTrim('CRAWLER_PROXY_URLS')?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
  const single = envTrim('CRAWLER_PROXY_URL')
  const hostPortLine = envTrim('CRAWLER_PROXY_HOSTPORT')
  const fromHostPort = hostPortLine ? [hostPortLine] : []
  if (single) return [single, ...multi]
  if (fromHostPort.length > 0) return [...fromHostPort, ...multi]
  return multi
}

export function proxyFromEnv(): CrawlerProxyConfig | undefined {
  const lines = collectProxyLines()
  if (lines.length === 0) return undefined
  const line = lines[proxyRoundRobinIdx % lines.length]
  proxyRoundRobinIdx += 1
  if (!line) return undefined
  const parsed = parseProxyLine(line)
  if (!parsed) {
    logger.warn('CRAWLER_PROXY_* value could not be parsed; crawling without proxy', {
      hint: 'Use CRAWLER_PROXY_URL=http://user:pass@host:port or CRAWLER_PROXY_HOSTPORT=host:port:user:pass'
    })
  }
  return parsed ?? undefined
}

/** Safe log payload — never includes credentials. */
export function proxyLogMeta(proxy: CrawlerProxyConfig): { server: string; auth: 'none' | 'userpass' } {
  return {
    server: proxy.server,
    auth: proxy.username || proxy.password ? 'userpass' : 'none'
  }
}
