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

const GRAPH_VERSION = 'v21.0'
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`

function captionOf(post: PlatformPostInput): string {
  const tags = post.hashtags.length > 0 ? `\n\n${post.hashtags.join(' ')}` : ''
  return `${post.captionText}${tags}`.trim()
}

export class FacebookPublisher extends BasePlatformPublisher {
  readonly platform: SocialPlatform = 'FACEBOOK'

  async getAuthorizationUrl(params: { userId: number; redirectUri: string }): Promise<OAuthAuthorizationTarget> {
    const clientId = requireEnv('FACEBOOK_CLIENT_ID')
    const state = randomBytes(24).toString('hex')
    const url = new URL('https://www.facebook.com/v21.0/dialog/oauth')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', params.redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'pages_show_list,pages_manage_posts,pages_read_engagement,pages_manage_metadata,publish_video,business_management')
    url.searchParams.set('state', state)
    return { url: url.toString(), state, codeVerifier: null }
  }

  async exchangeCode(params: { code: string; redirectUri: string; codeVerifier: string | null }): Promise<OAuthExchangeResult> {
    const clientId = requireEnv('FACEBOOK_CLIENT_ID')
    const clientSecret = requireEnv('FACEBOOK_CLIENT_SECRET')
    const tokenRes = await platformFetch(
      `${GRAPH}/oauth/access_token?${new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: params.redirectUri,
        code: params.code
      }).toString()}`,
      { method: 'GET' },
      { platform: this.platform }
    )
    const tokenBody = asRecord(tokenRes.json)
    const shortLived = stringOrNull(tokenBody.access_token)
    if (!shortLived) {
      throw new PlatformPublishError('Facebook oauth missing access_token', { platform: this.platform, status: tokenRes.status, retryable: false, body: tokenBody })
    }
    const longRes = await platformFetch(
      `${GRAPH}/oauth/access_token?${new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: clientId,
        client_secret: clientSecret,
        fb_exchange_token: shortLived
      }).toString()}`,
      { method: 'GET' },
      { platform: this.platform }
    )
    const longBody = asRecord(longRes.json)
    const userLong = stringOrNull(longBody.access_token) ?? shortLived

    const pagesRes = await platformFetch(
      `${GRAPH}/me/accounts?${new URLSearchParams({ fields: 'id,name,access_token,picture{data}', access_token: userLong }).toString()}`,
      { method: 'GET' },
      { platform: this.platform }
    )
    const pagesBody = asRecord(pagesRes.json)
    const pages = Array.isArray(pagesBody.data) ? pagesBody.data.map(asRecord) : []
    const page = pages[0]
    if (!page) {
      throw new PlatformPublishError('Facebook oauth: no managed pages', { platform: this.platform, status: 400, retryable: false, body: pagesBody })
    }
    const pageId = stringOrNull(page.id)
    const pageName = stringOrNull(page.name)
    const pageToken = stringOrNull(page.access_token)
    if (!pageId || !pageToken) {
      throw new PlatformPublishError('Facebook oauth: page missing id or token', { platform: this.platform, status: 400, retryable: false, body: page })
    }
    const avatar = stringOrNull(asRecord(asRecord(page.picture).data).url)
    return {
      accountId: pageId,
      accountName: pageName,
      accountUsername: pageName,
      avatarUrl: avatar,
      accessToken: pageToken,
      refreshToken: null,
      scopes: null,
      expiresAt: expiresFromNow(numberOrNull(longBody.expires_in)),
      tokenType: 'bearer',
      metadata: { pageId }
    }
  }

  async refreshAccessToken(credential: PlatformCredential): Promise<PlatformTokenRefreshResult> {
    const res = await platformFetch(
      `${GRAPH}/oauth/access_token?${new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: requireEnv('FACEBOOK_CLIENT_ID'),
        client_secret: requireEnv('FACEBOOK_CLIENT_SECRET'),
        fb_exchange_token: credential.accessToken
      }).toString()}`,
      { method: 'GET' },
      { platform: this.platform }
    )
    const body = asRecord(res.json)
    const token = stringOrNull(body.access_token)
    if (!token) {
      throw new PlatformPublishError('Facebook refresh missing token', { platform: this.platform, status: res.status, retryable: false, body })
    }
    return { accessToken: token, refreshToken: null, expiresAt: expiresFromNow(numberOrNull(body.expires_in)), scopes: null }
  }

  async publish(credential: PlatformCredential, post: PlatformPostInput): Promise<PlatformPublishResult> {
    const caption = captionOf(post)
    const [first] = post.mediaUrls
    const pageId = credential.accountId
    const body = new URLSearchParams({ access_token: credential.accessToken, message: caption })
    if (first) body.set('url', first)
    const endpoint = first ? 'photos' : 'feed'
    const res = await platformFetch(`${GRAPH}/${pageId}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    }, { platform: this.platform })
    const payload = asRecord(res.json)
    const postId = stringOrNull(payload.post_id) ?? stringOrNull(payload.id)
    if (!postId) {
      throw new PlatformPublishError('Facebook publish missing post id', { platform: this.platform, status: res.status, retryable: true, body: payload })
    }
    return {
      platformPostId: postId,
      platformPostUrl: `https://www.facebook.com/${postId}`,
      rawResponse: payload
    }
  }

  async fetchAnalytics(credential: PlatformCredential, platformPostId: string): Promise<PlatformAnalyticsSnapshot> {
    const metrics = 'post_impressions,post_impressions_unique,post_reactions_like_total,post_clicks,post_video_views'
    const res = await platformFetch(
      `${GRAPH}/${platformPostId}/insights?${new URLSearchParams({ metric: metrics, access_token: credential.accessToken }).toString()}`,
      { method: 'GET' },
      { platform: this.platform }
    )
    const body = asRecord(res.json)
    const data = Array.isArray(body.data) ? body.data.map(asRecord) : []
    const snapshot: PlatformAnalyticsSnapshot = {
      reach: null,
      impressions: null,
      likes: null,
      comments: null,
      shares: null,
      saves: null,
      linkClicks: null,
      videoViews: null,
      rawPayload: body
    }
    for (const item of data) {
      const name = stringOrNull(item.name)
      const values = Array.isArray(item.values) ? item.values.map(asRecord) : []
      const latest = values[values.length - 1]
      const value = latest ? numberOrNull(latest.value) : null
      if (name === 'post_impressions_unique') snapshot.reach = value
      else if (name === 'post_impressions') snapshot.impressions = value
      else if (name === 'post_reactions_like_total') snapshot.likes = value
      else if (name === 'post_clicks') snapshot.linkClicks = value
      else if (name === 'post_video_views') snapshot.videoViews = value
    }
    return snapshot
  }
}
