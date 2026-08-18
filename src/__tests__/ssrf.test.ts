import { describe, expect, it } from 'vitest'

import { isSsrSafeUrlLiteral } from '@/lib/http/ssrf-static'

describe('isSsrSafeUrlLiteral', () => {
  it('accepts public https URLs', () => {
    expect(isSsrSafeUrlLiteral('https://cbu01.alicdn.com/img/abc.jpg')).toBe(true)
    expect(isSsrSafeUrlLiteral('https://lh3.googleusercontent.com/d/abc')).toBe(true)
  })

  it('rejects non-https protocols', () => {
    expect(isSsrSafeUrlLiteral('http://example.com/img.jpg')).toBe(false)
    expect(isSsrSafeUrlLiteral('file:///etc/passwd')).toBe(false)
    expect(isSsrSafeUrlLiteral('ftp://example.com/x.jpg')).toBe(false)
  })

  it('rejects private and loopback IP literals', () => {
    expect(isSsrSafeUrlLiteral('https://127.0.0.1/secret')).toBe(false)
    expect(isSsrSafeUrlLiteral('https://localhost/x')).toBe(false)
    expect(isSsrSafeUrlLiteral('https://10.0.0.5/x')).toBe(false)
    expect(isSsrSafeUrlLiteral('https://192.168.1.1/x')).toBe(false)
    expect(isSsrSafeUrlLiteral('https://172.16.0.1/x')).toBe(false)
    expect(isSsrSafeUrlLiteral('https://169.254.169.254/latest/meta-data/')).toBe(false)
    expect(isSsrSafeUrlLiteral('https://[::1]/x')).toBe(false)
    expect(isSsrSafeUrlLiteral('https://[::ffff:10.0.0.1]/x')).toBe(false)
  })

  it('rejects metadata and internal hostnames', () => {
    expect(isSsrSafeUrlLiteral('https://metadata.google.internal/x')).toBe(false)
    expect(isSsrSafeUrlLiteral('https://metadata/x')).toBe(false)
    expect(isSsrSafeUrlLiteral('https://db.internal/x')).toBe(false)
    expect(isSsrSafeUrlLiteral('https://router.local/x')).toBe(false)
  })

  it('rejects malformed URLs', () => {
    expect(isSsrSafeUrlLiteral('not-a-url')).toBe(false)
    expect(isSsrSafeUrlLiteral('')).toBe(false)
  })

  it('accepts public IPv4 and IPv6 literals', () => {
    expect(isSsrSafeUrlLiteral('https://8.8.8.8/x')).toBe(true)
    expect(isSsrSafeUrlLiteral('https://[2606:4700:4700::1111]/x')).toBe(true)
  })
})
