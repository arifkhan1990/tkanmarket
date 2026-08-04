import { createHash, randomBytes } from 'node:crypto'

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

const OAUTH_AUTHORIZE = 'https://www.tiktok.com/v2/auth/authorize/'
const OAUTH_TOKEN = 'https://open.tiktokapis.com/v2/oauth/token/'
const CONTENT_API = 'https://open.tiktokapis.com/v2/post/publish/video/init/'
const CREATOR_INFO = 'https://open.tiktokapis.com/v2/post/publish/creator_info/query/'
const USER_INFO = 'https://open.tiktokapis.com/v2/user/info/'
const VIDEO_LIST = 'https://open.tiktokapis.com/v2/video/list/'
const VIDEO_QUERY = 'https://open.tiktokapis.com/v2/video/query/'

function pkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(48).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export class TikTokPublisher extends BasePlatformPublisher {
  readonly platform: SocialPlatform = 'TIKTOK'

  async getAuthorizationUrl(params: { userId: number; redirectUri: string }): Promise<OAuthAuthorizationTarget> {
    const clientKey = requireEnv('TIKTOK_CLIENT_ID')
    const state = randomBytes(24).toString('hex')
    const { verifier, challenge } = pkce()
    const url = new URL(OAUTH_AUTHORIZE)
    url.searchParams.set('client_key', clientKey)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'user.info.basic,video.publish,video.upload,video.list')
    url.searchParams.set('redirect_uri', params.redirectUri)
    url.searchParams.set('state', state)
    url.searchParams.set('code_challenge', challenge)
    url.searchParams.set('code_challenge_method', 'S256')
    return { url: url.toString(), state, codeVerifier: verifier }
  }

  async exchangeCode(params: { code: string; redirectUri: string; codeVerifier: string | null }): Promise<OAuthExchangeResult> {
    if (!params.codeVerifier) {
      throw new PlatformPublishError('TikTok oauth: missing PKCE verifier', { platform: this.platform, status: 400, retryable: false })
    }
    const body = new URLSearchParams({
      client_key: requireEnv('TIKTOK_CLIENT_ID'),
      client_secret: requireEnv('TIKTOK_CLIENT_SECRET'),
      code: params.code,
      grant_type: 'authorization_code',
      redirect_uri: params.redirectUri,
      code_verifier: params.codeVerifier
    })
    const res = await platformFetch(OAUTH_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    }, { platform: this.platform })
    const payload = asRecord(res.json)
    const accessToken = stringOrNull(payload.access_token)
    if (!accessToken) {
      throw new PlatformPublishError('TikTok oauth: missing access_token', { platform: this.platform, status: res.status, retryable: false, body: payload })
    }
    const openId = stringOrNull(payload.open_id) ?? ''
    const expiresIn = numberOrNull(payload.expires_in)

    let username: string | null = null
    let avatarUrl: string | null = null
    let displayName: string | null = null
    try {
      const userRes = await platformFetch(`${USER_INFO}?${new URLSearchParams({ fields: 'open_id,union_id,avatar_url,display_name,username' }).toString()}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` }
      }, { platform: this.platform })
      const user = asRecord(asRecord(userRes.json).data)
      const u = asRecord(user.user)
      username = stringOrNull(u.username)
      avatarUrl = stringOrNull(u.avatar_url)
      displayName = stringOrNull(u.display_name)
    } catch {
      // Non-fatal; we still have open_id
    }

    return {
      accountId: openId || (username ?? 'unknown'),
      accountName: displayName,
      accountUsername: username,
      avatarUrl,
      accessToken,
      refreshToken: stringOrNull(payload.refresh_token),
      scopes: typeof payload.scope === 'string' ? payload.scope.split(',') : null,
      expiresAt: expiresFromNow(expiresIn),
      tokenType: stringOrNull(payload.token_type),
      metadata: { unionId: stringOrNull(payload.union_id) }
    }
  }

  async refreshAccessToken(credential: PlatformCredential): Promise<PlatformTokenRefreshResult> {
    if (!credential.refreshToken) {
      throw new PlatformPublishError('TikTok refresh: no refresh token', { platform: this.platform, status: 400, retryable: false })
    }
    const body = new URLSearchParams({
      client_key: requireEnv('TIKTOK_CLIENT_ID'),
      client_secret: requireEnv('TIKTOK_CLIENT_SECRET'),
      grant_type: 'refresh_token',
      refresh_token: credential.refreshToken
    })
    const res = await platformFetch(OAUTH_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    }, { platform: this.platform })
    const payload = asRecord(res.json)
    const accessToken = stringOrNull(payload.access_token)
    if (!accessToken) {
      throw new PlatformPublishError('TikTok refresh: missing access_token', { platform: this.platform, status: res.status, retryable: false, body: payload })
    }
    return {
      accessToken,
      refreshToken: stringOrNull(payload.refresh_token) ?? credential.refreshToken,
      expiresAt: expiresFromNow(numberOrNull(payload.expires_in)),
      scopes: typeof payload.scope === 'string' ? payload.scope.split(',') : null
    }
  }

  async publish(credential: PlatformCredential, post: PlatformPostInput): Promise<PlatformPublishResult> {
    const [videoUrl] = post.mediaUrls
    if (!videoUrl) {
      throw new PlatformPublishError('TikTok publish requires a video URL', { platform: this.platform, status: 400, retryable: false })
    }

    const creatorRes = await platformFetch(CREATOR_INFO, {
      method: 'POST',
      headers: { Authorization: `Bearer ${credential.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }, { platform: this.platform })
    const creator = asRecord(asRecord(creatorRes.json).data)
    const privacyLevel = Array.isArray(creator.privacy_level_options) && creator.privacy_level_options.length > 0
      ? String(creator.privacy_level_options[0])
      : 'SELF_ONLY'

    const tags = post.hashtags.join(' ')
    const title = `${post.captionText}${tags.length > 0 ? `\n${tags}` : ''}`.slice(0, 2200)

    const initRes = await platformFetch(CONTENT_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${credential.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_info: {
          title,
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          brand_content_toggle: false,
          brand_organic_toggle: false
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl
        }
      })
    }, { platform: this.platform })
    const body = asRecord(initRes.json)
    const data = asRecord(body.data)
    const publishId = stringOrNull(data.publish_id)
    if (!publishId) {
      throw new PlatformPublishError('TikTok init: missing publish_id', { platform: this.platform, status: initRes.status, retryable: true, body })
    }
    return {
      platformPostId: publishId,
      platformPostUrl: null,
      rawResponse: body
    }
  }

  async fetchAnalytics(credential: PlatformCredential, platformPostId: string): Promise<PlatformAnalyticsSnapshot> {
    const snapshot: PlatformAnalyticsSnapshot = {
      reach: null,
      impressions: null,
      likes: null,
      comments: null,
      shares: null,
      saves: null,
      linkClicks: null,
      videoViews: null,
      rawPayload: {}
    }
    try {
      const res = await platformFetch(VIDEO_QUERY, {
        method: 'POST',
        headers: { Authorization: `Bearer ${credential.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: { video_ids: [platformPostId] },
          fields: 'id,like_count,comment_count,share_count,view_count'
        })
      }, { platform: this.platform })
      const data = asRecord(asRecord(res.json).data)
      const videos = Array.isArray(data.videos) ? data.videos.map(asRecord) : []
      const video = videos[0]
      snapshot.rawPayload = asRecord(res.json)
      if (video) {
        snapshot.likes = numberOrNull(video.like_count)
        snapshot.comments = numberOrNull(video.comment_count)
        snapshot.shares = numberOrNull(video.share_count)
        snapshot.videoViews = numberOrNull(video.view_count)
      }
    } catch (err) {
      if (err instanceof PlatformPublishError && !err.retryable) {
        snapshot.rawPayload = { error: err.message }
      } else {
        throw err
      }
    }
    if (snapshot.videoViews === null) {
      try {
        const res = await platformFetch(`${VIDEO_LIST}?${new URLSearchParams({ fields: 'id,like_count,comment_count,share_count,view_count', max_count: '20' }).toString()}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${credential.accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }, { platform: this.platform })
        const list = asRecord(asRecord(res.json).data)
        const items = Array.isArray(list.videos) ? list.videos.map(asRecord) : []
        const match = items.find((v) => stringOrNull(v.id) === platformPostId)
        if (match) {
          snapshot.likes = snapshot.likes ?? numberOrNull(match.like_count)
          snapshot.comments = snapshot.comments ?? numberOrNull(match.comment_count)
          snapshot.shares = snapshot.shares ?? numberOrNull(match.share_count)
          snapshot.videoViews = snapshot.videoViews ?? numberOrNull(match.view_count)
        }
      } catch {
        // tolerated
      }
    }
    return snapshot
  }
}
