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

const OAUTH_AUTHORIZE = 'https://accounts.google.com/o/oauth2/v2/auth'
const OAUTH_TOKEN = 'https://oauth2.googleapis.com/token'
const UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/youtube/v3/videos'
const CHANNELS = 'https://www.googleapis.com/youtube/v3/channels'
const VIDEOS = 'https://www.googleapis.com/youtube/v3/videos'
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly']

export class YouTubePublisher extends BasePlatformPublisher {
  readonly platform: SocialPlatform = 'YOUTUBE'

  async getAuthorizationUrl(params: { userId: number; redirectUri: string }): Promise<OAuthAuthorizationTarget> {
    const state = randomBytes(24).toString('hex')
    const url = new URL(OAUTH_AUTHORIZE)
    url.searchParams.set('client_id', requireEnv('YOUTUBE_CLIENT_ID'))
    url.searchParams.set('redirect_uri', params.redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', SCOPES.join(' '))
    url.searchParams.set('access_type', 'offline')
    url.searchParams.set('prompt', 'consent')
    url.searchParams.set('state', state)
    return { url: url.toString(), state, codeVerifier: null }
  }

  async exchangeCode(params: { code: string; redirectUri: string; codeVerifier: string | null }): Promise<OAuthExchangeResult> {
    const body = new URLSearchParams({
      code: params.code,
      client_id: requireEnv('YOUTUBE_CLIENT_ID'),
      client_secret: requireEnv('YOUTUBE_CLIENT_SECRET'),
      redirect_uri: params.redirectUri,
      grant_type: 'authorization_code'
    })
    const res = await platformFetch(OAUTH_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    }, { platform: this.platform })
    const payload = asRecord(res.json)
    const accessToken = stringOrNull(payload.access_token)
    if (!accessToken) {
      throw new PlatformPublishError('YouTube oauth missing access_token', { platform: this.platform, status: res.status, retryable: false, body: payload })
    }

    const channelRes = await platformFetch(`${CHANNELS}?${new URLSearchParams({ part: 'snippet', mine: 'true' }).toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    }, { platform: this.platform })
    const channelBody = asRecord(channelRes.json)
    const rawChannelItems = channelBody.items
    const channelItems = Array.isArray(rawChannelItems) ? rawChannelItems.map(asRecord) : []
    const channel = channelItems[0]
    const channelId = stringOrNull(asRecord(channel).id) ?? 'youtube'
    const snippet = asRecord(asRecord(channel).snippet)
    const title = stringOrNull(snippet.title)
    const avatar = stringOrNull(asRecord(asRecord(snippet.thumbnails).default).url)

    return {
      accountId: channelId,
      accountName: title,
      accountUsername: title,
      avatarUrl: avatar,
      accessToken,
      refreshToken: stringOrNull(payload.refresh_token),
      scopes: typeof payload.scope === 'string' ? payload.scope.split(' ') : SCOPES,
      expiresAt: expiresFromNow(numberOrNull(payload.expires_in)),
      tokenType: stringOrNull(payload.token_type),
      metadata: { channelId }
    }
  }

  async refreshAccessToken(credential: PlatformCredential): Promise<PlatformTokenRefreshResult> {
    if (!credential.refreshToken) {
      throw new PlatformPublishError('YouTube refresh: no refresh token', { platform: this.platform, status: 400, retryable: false })
    }
    const body = new URLSearchParams({
      client_id: requireEnv('YOUTUBE_CLIENT_ID'),
      client_secret: requireEnv('YOUTUBE_CLIENT_SECRET'),
      refresh_token: credential.refreshToken,
      grant_type: 'refresh_token'
    })
    const res = await platformFetch(OAUTH_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    }, { platform: this.platform })
    const payload = asRecord(res.json)
    const accessToken = stringOrNull(payload.access_token)
    if (!accessToken) {
      throw new PlatformPublishError('YouTube refresh missing token', { platform: this.platform, status: res.status, retryable: false, body: payload })
    }
    return {
      accessToken,
      refreshToken: stringOrNull(payload.refresh_token) ?? credential.refreshToken,
      expiresAt: expiresFromNow(numberOrNull(payload.expires_in)),
      scopes: typeof payload.scope === 'string' ? payload.scope.split(' ') : null
    }
  }

  async publish(credential: PlatformCredential, post: PlatformPostInput): Promise<PlatformPublishResult> {
    const [videoUrl] = post.mediaUrls
    if (!videoUrl) {
      throw new PlatformPublishError('YouTube publish requires a video URL', { platform: this.platform, status: 400, retryable: false })
    }
    const videoRes = await platformFetch(videoUrl, { method: 'GET' }, { platform: this.platform, timeoutMs: 60_000 })
    const videoBuffer = Buffer.from(videoRes.text, 'binary')
    const title = post.captionText.slice(0, 100)
    const description = `${post.captionText}\n\n${post.hashtags.join(' ')}`.slice(0, 5000)

    const metadata = {
      snippet: {
        title,
        description,
        tags: post.hashtags.map((t) => t.replace(/^#/, '')).slice(0, 30),
        categoryId: '22'
      },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: false }
    }

    const boundary = `----tkanmarket_${randomBytes(12).toString('hex')}`
    const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
    const mediaPart = `--${boundary}\r\nContent-Type: video/*\r\n\r\n`
    const closing = `\r\n--${boundary}--`
    const body = Buffer.concat([Buffer.from(metadataPart, 'utf8'), Buffer.from(mediaPart, 'utf8'), videoBuffer, Buffer.from(closing, 'utf8')])

    const url = `${UPLOAD_ENDPOINT}?${new URLSearchParams({ uploadType: 'multipart', part: 'snippet,status' }).toString()}`
    const res = await platformFetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credential.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(body.length)
      },
      body
    }, { platform: this.platform, timeoutMs: 120_000 })
    const payload = asRecord(res.json)
    const videoId = stringOrNull(payload.id)
    if (!videoId) {
      throw new PlatformPublishError('YouTube upload: missing video id', { platform: this.platform, status: res.status, retryable: true, body: payload })
    }
    return {
      platformPostId: videoId,
      platformPostUrl: `https://www.youtube.com/watch?v=${videoId}`,
      rawResponse: payload
    }
  }

  async fetchAnalytics(credential: PlatformCredential, platformPostId: string): Promise<PlatformAnalyticsSnapshot> {
    const res = await platformFetch(`${VIDEOS}?${new URLSearchParams({ part: 'statistics', id: platformPostId }).toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${credential.accessToken}` }
    }, { platform: this.platform })
    const body = asRecord(res.json)
    const rawItems = body.items
    const items = Array.isArray(rawItems) ? rawItems.map(asRecord) : []
    const stats = asRecord(asRecord(items[0]).statistics)
    return {
      reach: null,
      impressions: null,
      likes: numberOrNull(stats.likeCount),
      comments: numberOrNull(stats.commentCount),
      shares: null,
      saves: numberOrNull(stats.favoriteCount),
      linkClicks: null,
      videoViews: numberOrNull(stats.viewCount),
      rawPayload: asRecord(res.json)
    }
  }
}
