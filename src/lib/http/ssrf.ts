import { lookup } from 'node:dns/promises'

import {
  isBlockedHostname,
  isIpLiteral,
  isPrivateIp,
  isSsrSafeUrlLiteral
} from '@/lib/http/ssrf-static'

export { isSsrSafeUrlLiteral } from '@/lib/http/ssrf-static'

/**
 * Async SSRF check adding a best-effort DNS resolution: every resolved address
 * must be public. If the hostname is already a blocked literal, it fails fast.
 * Node-only (uses `node:dns`) — do not import from client components.
 */
export async function isSsrSafeUrl(url: string): Promise<boolean> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '').replace(/^\[|\]$/g, '')
  if (isBlockedHostname(hostname)) return false

  if (isIpLiteral(hostname)) {
    return !isPrivateIp(hostname)
  }

  try {
    const addresses = await lookup(hostname, { all: true })
    if (addresses.length === 0) return true
    return addresses.every(({ address }) => !isPrivateIp(address))
  } catch {
    // Resolution failed — the subsequent fetch will fail too. Don't pre-block.
    return true
  }
}