/**
 * Client-safe (no Node built-ins) SSRF guard helpers for server-side `fetch` of
 * user- or crawler-supplied URLs. Blocks non-https protocols, private/reserved
 * IP ranges (including cloud metadata link-local 169.254.169.254), loopback and
 * metadata hostnames. The DNS-verifying variant lives in `ssrf.ts` (Node only).
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'localhost6.localdomain6',
  'metadata',
  'metadata.google.internal'
])

const BLOCKED_HOST_SUFFIXES = ['.internal', '.local', '.localhost', '.lan', '.localhostdomain']

const PRIVATE_IPV4_CIDRS: Array<[number, number]> = [
  [0x00000000, 8], // 0.0.0.0/8 — "this" network
  [0x0a000000, 8], // 10.0.0.0/8 — private
  [0x64400000, 10], // 100.64.0.0/10 — CGNAT
  [0x7f000000, 8], // 127.0.0.0/8 — loopback
  [0xa9fe0000, 16], // 169.254.0.0/16 — link-local (cloud metadata 169.254.169.254)
  [0xac100000, 12], // 172.16.0.0/12 — private
  [0xc0a80000, 16], // 192.168.0.0/16 — private
  [0xc0000000, 24], // 192.0.0.0/24 — IETF protocol assignments
  [0xc0000200, 24], // 192.0.2.0/24 — TEST-NET-1
  [0xc6120000, 15], // 198.18.0.0/15 — benchmarking
  [0xc6336400, 24], // 198.51.100.0/24 — TEST-NET-2
  [0xcb007100, 24], // 203.0.113.0/24 — TEST-NET-3
  [0xe0000000, 4], // 224.0.0.0/4 — multicast
  [0xf0000000, 4] // 240.0.0.0/4 — reserved
]

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let value = 0
  for (const part of parts) {
    const octet = Number(part)
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null
    value = (value << 8) | octet
  }
  return value >>> 0
}

function isPrivateIpv4(ip: string): boolean {
  const int = ipv4ToInt(ip)
  if (int === null) return false
  return PRIVATE_IPV4_CIDRS.some(([base, prefix]) => {
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
    return (int & mask) === (base & mask)
  })
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::' || lower === '::1') return true
  // fc00::/7 unique-local, fe80::/10 link-local, ff00::/8 multicast.
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
    return true
  }
  if (lower.startsWith('ff')) return true
  // IPv4-mapped IPv6 (::ffff:10.0.0.1 or normalized ::ffff:a00:1).
  const v4mapped = lower.match(/^::ffff:(.+)$/)
  if (v4mapped?.[1]) {
    const tail = v4mapped[1]
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(tail)) {
      if (isPrivateIpv4(tail)) return true
    } else {
      // Hex-group form (e.g. `a00:1`) — expand to 8 hex digits → dotted-decimal.
      const groups = tail.split(':')
      let hex = ''
      for (const group of groups) {
        hex += group.padStart(4, '0')
      }
      if (hex.length === 8) {
        const ipv4 = [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16),
          parseInt(hex.slice(6, 8), 16)
        ].join('.')
        if (isPrivateIpv4(ipv4)) return true
      }
    }
  }
  return false
}

function isIpLiteral(hostname: string): boolean {
  return hostname.includes(':') || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
}

export { isIpLiteral }

export function isPrivateIp(ip: string): boolean {
  return ip.includes(':') ? isPrivateIpv6(ip) : isPrivateIpv4(ip)
}

function isBlockedHostname(hostname: string): boolean {
  if (BLOCKED_HOSTNAMES.has(hostname)) return true
  return BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
}

export { isBlockedHostname }

/**
 * Sync static-only SSRF check: protocol + hostname blocklist + private IP literal
 * ranges. Does NOT resolve DNS. Cheap enough for URL filtering hot paths and safe
 * for client bundles (no Node imports).
 */
export function isSsrSafeUrlLiteral(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '').replace(/^\[|\]$/g, '')
  if (isBlockedHostname(hostname)) return false
  if (isIpLiteral(hostname)) return !isPrivateIp(hostname)
  return true
}