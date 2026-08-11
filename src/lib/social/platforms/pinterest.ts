import { randomBytes } from 'node:crypto'

import {
  BasePlatformPublisher,
  PlatformPublishError,
  asRecord,
  expiresFromNow,
  numberOrNull,
  platformFetch,
  requireEnv,
  stringOrNull
} from './types'
import type {
  OAuthAuthorizationTarget,
  OAuthExchangeResult,
  PlatformAnalyticsSnapshot,
  PlatformCredential,
  PlatformPostInput,
  PlatformPublishResult,
  PlatformTokenRefreshResult
} from './types'
import type { SocialPlatform } from '@/types/queue.types'

const BASE = 'https://api.pinterest.com/v5'
const AUTHORIZE = 'https://www.pinterest.com/oauth/'
const SCOPES = ['boards:read', 'boards:write', 'pins:read', 'pins:write', 'user_accounts:read']

function basicAuthHeader(): string {
  const id = requireEnv('PINTEREST_CLIENT_ID')
  const secret = requireEnv('PINTEREST_CLIENT_SECRET')
  return `Basic ${Buffer.from(`${id}:${secret}`, 'utf8').toString('base64')}`
}

export class PinterestPublisher extends BasePlatformPublisher {
  readonly platform: SocialPlatform = 'PINTEREST'

  async getAuthorizationUrl(params: { userId: number; redirectUri: string }): Promise<OAuthAuthorizationTarget> {
    const state = randomBytes(24).toString('hex')
    const url = new URL(AUTHORIZE)
    url.searchParams.set('client_id', requireEnv('PINTEREST_CLIENT_ID'))
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('redirect_uri', params.redirectUri)
    url.searchParams.set('scope', SCOPES.join(','))
    url.searchParams.set('state', state)
    return { url: url.toString(), state, codeVerifier: null }
  }

  async exchangeCode(params: { code: string; redirectUri: string; codeVerifier: string | null }): Promise<OAuthExchangeResult> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri
    })
    const res = await platformFetch(`${BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: basicAuthHeader() },
      body: body.toString()
    }, { platform: this.platform })
    const payload = asRecord(res.json)
    const accessToken = stringOrNull(payload.access_token)
    if (!accessToken) {
      throw new PlatformPublishError('Pinterest oauth: missing access_token', { platform: this.platform, status: res.status, retryable: false, body: payload })
    }

    const accountRes = await platformFetch(`${BASE}/user_account`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    }, { platform: this.platform })
    const account = asRecord(accountRes.json)
    const accountId = stringOrNull(account.username) ?? stringOrNull(account.id) ?? 'pinterest'
    return {
      accountId,
      accountName: stringOrNull(account.account_type),
      accountUsername: stringOrNull(account.username),
      avatarUrl: stringOrNull(account.profile_image),
      accessToken,
      refreshToken: stringOrNull(payload.refresh_token),
      scopes: typeof payload.scope === 'string' ? payload.scope.split(',') : SCOPES,
      expiresAt: expiresFromNow(numberOrNull(payload.expires_in)),
      tokenType: stringOrNull(payload.token_type),
      metadata: { websiteUrl: stringOrNull(account.website_url) }
    }
  }

  async refreshAccessToken(credential: PlatformCredential): Promise<PlatformTokenRefreshResult> {
    if (!credential.refreshToken) {
      throw new PlatformPublishError('Pinterest refresh: no refresh token', { platform: this.platform, status: 400, retryable: false })
    }
    const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: credential.refreshToken })
    const res = await platformFetch(`${BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: basicAuthHeader() },
      body: body.toString()
    }, { platform: this.platform })
    const payload = asRecord(res.json)
    const accessToken = stringOrNull(payload.access_token)
    if (!accessToken) {
      throw new PlatformPublishError('Pinterest refresh: missing access_token', { platform: this.platform, status: res.status, retryable: false, body: payload })
    }
    return {
      accessToken,
      refreshToken: stringOrNull(payload.refresh_token) ?? credential.refreshToken,
      expiresAt: expiresFromNow(numberOrNull(payload.expires_in)),
      scopes: typeof payload.scope === 'string' ? payload.scope.split(',') : null
    }
  }

  private async resolveDefaultBoardId(credential: PlatformCredential): Promise<string> {
    const metaBoard = stringOrNull((credential.metadata ?? {}).defaultBoardId as string | undefined)
    if (metaBoard) return metaBoard
    const res = await platformFetch(`${BASE}/boards?page_size=25`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${credential.accessToken}` }
    }, { platform: this.platform })
    const responseBody = asRecord(res.json)
    const rawItems = responseBody.items
    const items: unknown[] = Array.isArray(rawItems) ? rawItems : []
    const boards = items.map(asRecord)
    const id =
      stringOrNull(boards.find((b) => stringOrNull(b.privacy) === 'PUBLIC')?.id) ??
      stringOrNull(boards.find((b) => stringOrNull(b.privacy) !== 'SECRET')?.id) ??
      stringOrNull(boards[0]?.id)
    if (!id) {
      throw new PlatformPublishError('Pinterest publish: no board available on account', { platform: this.platform, status: 412, retryable: false })
    }
    return id
  }

  async publish(credential: PlatformCredential, post: PlatformPostInput): Promise<PlatformPublishResult> {
    const [mediaUrl] = post.mediaUrls
    if (!mediaUrl) {
      throw new PlatformPublishError('Pinterest publish requires an image URL', { platform: this.platform, status: 400, retryable: false })
    }
    const boardId = await this.resolveDefaultBoardId(credential)
    const description = [post.captionText, post.hashtags.join(' ')].filter(Boolean).join('\n\n').slice(0, 500)
    const title = post.captionText.slice(0, 100)

    const res = await platformFetch(`${BASE}/pins`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${credential.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        board_id: boardId,
        title,
        description,
        link: post.link ?? undefined,
        media_source: { source_type: 'image_url', url: mediaUrl }
      })
    }, { platform: this.platform })
    const body = asRecord(res.json)
    const pinId = stringOrNull(body.id)
    if (!pinId) {
      throw new PlatformPublishError('Pinterest publish: missing pin id', { platform: this.platform, status: res.status, retryable: true, body })
    }
    return {
      platformPostId: pinId,
      platformPostUrl: `https://www.pinterest.com/pin/${pinId}/`,
      rawResponse: body
    }
  }

  async fetchAnalytics(credential: PlatformCredential, platformPostId: string): Promise<PlatformAnalyticsSnapshot> {
    const end = new Date()
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
    const params = new URLSearchParams({
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      metric_types: 'IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK'
    })
    const res = await platformFetch(`${BASE}/pins/${platformPostId}/analytics?${params.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${credential.accessToken}` }
    }, { platform: this.platform })
    const body = asRecord(res.json)
    const all = asRecord(body.all_time)
    const summary = asRecord(all.summary_metrics)
    return {
      reach: null,
      impressions: numberOrNull(summary.IMPRESSION) ?? numberOrNull(summary.impression),
      likes: null,
      comments: null,
      shares: null,
      saves: numberOrNull(summary.SAVE) ?? numberOrNull(summary.save),
      linkClicks: numberOrNull(summary.PIN_CLICK) ?? numberOrNull(summary.OUTBOUND_CLICK),
      videoViews: null,
      rawPayload: body
    }
  }
}
