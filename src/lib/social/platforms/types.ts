import type { SocialPlatform } from '@/types/queue.types'

export interface PlatformCredential {
  id: number
  userId: number
  platform: SocialPlatform
  accountId: string
  accountName: string | null
  accountUsername: string | null
  accessToken: string
  refreshToken: string | null
  scopes: string[] | null
  expiresAt: Date | null
  metadata: Record<string, unknown> | null
}

export interface PlatformPostInput {
  captionText: string
  hashtags: string[]
  scriptText: string | null
  mediaUrls: string[]
  contentType: 'REEL_5' | 'REEL_8' | 'REEL_10' | 'CAROUSEL' | 'IMAGE_POST' | 'PIN'
  /** Destination link attached to the post (e.g. the fabric detail page on TkanMarket). */
  link?: string | null
}

export interface PlatformPublishResult {
  platformPostId: string
  platformPostUrl: string | null
  rawResponse: Record<string, unknown>
}

export interface PlatformAnalyticsSnapshot {
  reach: number | null
  impressions: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  linkClicks: number | null
  videoViews: number | null
  rawPayload: Record<string, unknown>
}

export interface PlatformTokenRefreshResult {
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
  scopes: string[] | null
}

export interface OAuthAuthorizationTarget {
  url: string
  state: string
  codeVerifier: string | null
}

export interface OAuthExchangeResult {
  accountId: string
  accountName: string | null
  accountUsername: string | null
  avatarUrl: string | null
  accessToken: string
  refreshToken: string | null
  scopes: string[] | null
  expiresAt: Date | null
  tokenType: string | null
  metadata: Record<string, unknown> | null
}

export class PlatformPublishError extends Error {
  readonly platform: SocialPlatform
  readonly status: number | null
  readonly retryable: boolean
  readonly body: unknown

  constructor(message: string, options: { platform: SocialPlatform; status: number | null; retryable: boolean; body?: unknown }) {
    super(message)
    this.name = 'PlatformPublishError'
    this.platform = options.platform
    this.status = options.status
    this.retryable = options.retryable
    this.body = options.body
  }
}

export abstract class BasePlatformPublisher {
  abstract readonly platform: SocialPlatform

  abstract getAuthorizationUrl(params: { userId: number; redirectUri: string }): Promise<OAuthAuthorizationTarget>

  abstract exchangeCode(params: { code: string; redirectUri: string; codeVerifier: string | null }): Promise<OAuthExchangeResult>

  abstract refreshAccessToken(credential: PlatformCredential): Promise<PlatformTokenRefreshResult>

  abstract publish(credential: PlatformCredential, post: PlatformPostInput): Promise<PlatformPublishResult>

  abstract fetchAnalytics(credential: PlatformCredential, platformPostId: string): Promise<PlatformAnalyticsSnapshot>
}

const RETRY_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])

export async function platformFetch(
  url: string,
  init: RequestInit,
  context: { platform: SocialPlatform; timeoutMs?: number }
): Promise<{ status: number; headers: Headers; json: unknown; text: string }> {
  const timeoutMs = context.timeoutMs ?? 20_000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    const text = await res.text()
    let json: unknown = null
    if (text.length > 0) {
      try {
        json = JSON.parse(text)
      } catch {
        json = null
      }
    }
    if (!res.ok) {
      throw new PlatformPublishError(`${context.platform} API ${res.status} ${res.statusText}`, {
        platform: context.platform,
        status: res.status,
        retryable: RETRY_STATUS.has(res.status),
        body: json ?? text
      })
    }
    return { status: res.status, headers: res.headers, json, text }
  } catch (err) {
    if (err instanceof PlatformPublishError) throw err
    const message = err instanceof Error ? err.message : 'Platform fetch failed'
    throw new PlatformPublishError(message, { platform: context.platform, status: null, retryable: true })
  } finally {
    clearTimeout(timer)
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.length === 0) {
    throw new Error(`${name} env var is required for this platform integration`)
  }
  return value
}

export function expiresFromNow(seconds: number | null | undefined): Date | null {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return null
  return new Date(Date.now() + seconds * 1000)
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

export function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export function stringOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value
  return null
}
