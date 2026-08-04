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

function buildCaption(post: PlatformPostInput): string {
  const hashtagLine = post.hashtags.length > 0 ? `\n\n${post.hashtags.join(' ')}` : ''
  return `${post.captionText}${hashtagLine}`.trim()
}

export class InstagramPublisher extends BasePlatformPublisher {
  readonly platform: SocialPlatform = 'INSTAGRAM'

  async getAuthorizationUrl(params: { userId: number; redirectUri: string }): Promise<OAuthAuthorizationTarget> {
    const clientId = requireEnv('INSTAGRAM_CLIENT_ID')
    const state = randomBytes(24).toString('hex')
    const scope = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management'
    const url = new URL('https://www.facebook.com/v21.0/dialog/oauth')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', params.redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', scope)
    url.searchParams.set('state', state)
    return { url: url.toString(), state, codeVerifier: null }
  }

  async exchangeCode(params: { code: string; redirectUri: string; codeVerifier: string | null }): Promise<OAuthExchangeResult> {
    const clientId = requireEnv('INSTAGRAM_CLIENT_ID')
    const clientSecret = requireEnv('INSTAGRAM_CLIENT_SECRET')
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
      throw new PlatformPublishError('Instagram oauth: missing access_token', {
        platform: this.platform,
        status: tokenRes.status,
        retryable: false,
        body: tokenBody
      })
    }

    const longLivedRes = await platformFetch(
      `${GRAPH}/oauth/access_token?${new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: clientId,
        client_secret: clientSecret,
        fb_exchange_token: shortLived
      }).toString()}`,
      { method: 'GET' },
      { platform: this.platform }
    )
    const llBody = asRecord(longLivedRes.json)
    const longLived = stringOrNull(llBody.access_token) ?? shortLived
    const expiresIn = numberOrNull(llBody.expires_in) ?? numberOrNull(tokenBody.expires_in)

    const pagesRes = await platformFetch(
      `${GRAPH}/me/accounts?${new URLSearchParams({
        fields: 'id,name,access_token,instagram_business_account{id,username,profile_picture_url,name}',
        access_token: longLived
      }).toString()}`,
      { method: 'GET' },
      { platform: this.platform }
    )
    const pagesBody = asRecord(pagesRes.json)
    const pages = Array.isArray(pagesBody.data) ? pagesBody.data : []
    const igPage = pages
      .map(asRecord)
      .find((p) => asRecord(p.instagram_business_account).id !== undefined)
    if (!igPage) {
      throw new PlatformPublishError('Instagram oauth: no business account linked', {
        platform: this.platform,
        status: 400,
        retryable: false,
        body: pagesBody
      })
    }
    const pageAccessToken = stringOrNull(igPage.access_token) ?? longLived
    const igAccount = asRecord(igPage.instagram_business_account)
    const accountId = stringOrNull(igAccount.id)
    if (!accountId) {
      throw new PlatformPublishError('Instagram oauth: missing instagram_business_account.id', {
        platform: this.platform,
        status: 400,
        retryable: false
      })
    }

    return {
      accountId,
      accountName: stringOrNull(igAccount.name) ?? stringOrNull(igPage.name),
      accountUsername: stringOrNull(igAccount.username),
      avatarUrl: stringOrNull(igAccount.profile_picture_url),
      accessToken: pageAccessToken,
      refreshToken: null,
      scopes: null,
      expiresAt: expiresFromNow(expiresIn),
      tokenType: 'bearer',
      metadata: { pageId: stringOrNull(igPage.id), igUserId: accountId }
    }
  }

  async refreshAccessToken(credential: PlatformCredential): Promise<PlatformTokenRefreshResult> {
    const res = await platformFetch(
      `${GRAPH}/oauth/access_token?${new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: requireEnv('INSTAGRAM_CLIENT_ID'),
        client_secret: requireEnv('INSTAGRAM_CLIENT_SECRET'),
        fb_exchange_token: credential.accessToken
      }).toString()}`,
      { method: 'GET' },
      { platform: this.platform }
    )
    const body = asRecord(res.json)
    const token = stringOrNull(body.access_token)
    if (!token) {
      throw new PlatformPublishError('Instagram refresh: missing access_token', {
        platform: this.platform,
        status: res.status,
        retryable: false,
        body
      })
    }
    return {
      accessToken: token,
      refreshToken: null,
      expiresAt: expiresFromNow(numberOrNull(body.expires_in)),
      scopes: null
    }
  }

  async publish(credential: PlatformCredential, post: PlatformPostInput): Promise<PlatformPublishResult> {
    const caption = buildCaption(post)
    const igUserId = credential.accountId

    if (post.contentType === 'CAROUSEL' && post.mediaUrls.length >= 2) {
      return this.publishCarousel(credential, igUserId, post.mediaUrls, caption)
    }
    if (post.contentType.startsWith('REEL_')) {
      const [first] = post.mediaUrls
      if (!first) throw new PlatformPublishError('Instagram reel requires at least one media URL', { platform: this.platform, status: 400, retryable: false })
      return this.publishSingle(credential, igUserId, { mediaType: 'REELS', videoUrl: first, caption })
    }
    const [first] = post.mediaUrls
    if (!first) throw new PlatformPublishError('Instagram image post requires media URL', { platform: this.platform, status: 400, retryable: false })
    return this.publishSingle(credential, igUserId, { mediaType: 'IMAGE', imageUrl: first, caption })
  }

  private async publishSingle(
    credential: PlatformCredential,
    igUserId: string,
    params: { mediaType: 'IMAGE' | 'REELS'; imageUrl?: string; videoUrl?: string; caption: string }
  ): Promise<PlatformPublishResult> {
    const createParams = new URLSearchParams({
      access_token: credential.accessToken,
      caption: params.caption
    })
    if (params.mediaType === 'IMAGE' && params.imageUrl) {
      createParams.set('image_url', params.imageUrl)
    } else if (params.mediaType === 'REELS' && params.videoUrl) {
      createParams.set('media_type', 'REELS')
      createParams.set('video_url', params.videoUrl)
    }
    const createRes = await platformFetch(`${GRAPH}/${igUserId}/media?${createParams.toString()}`, { method: 'POST' }, { platform: this.platform })
    const createBody = asRecord(createRes.json)
    const creationId = stringOrNull(createBody.id)
    if (!creationId) {
      throw new PlatformPublishError('Instagram create: missing creation id', { platform: this.platform, status: createRes.status, retryable: false, body: createBody })
    }

    if (params.mediaType === 'REELS') {
      await this.waitForReelReady(credential, creationId)
    }

    const publishRes = await platformFetch(
      `${GRAPH}/${igUserId}/media_publish?${new URLSearchParams({ access_token: credential.accessToken, creation_id: creationId }).toString()}`,
      { method: 'POST' },
      { platform: this.platform }
    )
    const publishBody = asRecord(publishRes.json)
    const mediaId = stringOrNull(publishBody.id)
    if (!mediaId) {
      throw new PlatformPublishError('Instagram publish: missing media id', { platform: this.platform, status: publishRes.status, retryable: true, body: publishBody })
    }
    return {
      platformPostId: mediaId,
      platformPostUrl: await this.fetchPermalink(credential, mediaId),
      rawResponse: publishBody
    }
  }

  private async publishCarousel(
    credential: PlatformCredential,
    igUserId: string,
    mediaUrls: string[],
    caption: string
  ): Promise<PlatformPublishResult> {
    const childIds: string[] = []
    for (const url of mediaUrls.slice(0, 10)) {
      const childRes = await platformFetch(
        `${GRAPH}/${igUserId}/media?${new URLSearchParams({
          access_token: credential.accessToken,
          is_carousel_item: 'true',
          image_url: url
        }).toString()}`,
        { method: 'POST' },
        { platform: this.platform }
      )
      const id = stringOrNull(asRecord(childRes.json).id)
      if (!id) {
        throw new PlatformPublishError('Instagram carousel child creation failed', {
          platform: this.platform,
          status: childRes.status,
          retryable: false,
          body: childRes.json
        })
      }
      childIds.push(id)
    }

    const containerRes = await platformFetch(
      `${GRAPH}/${igUserId}/media?${new URLSearchParams({
        access_token: credential.accessToken,
        media_type: 'CAROUSEL',
        caption,
        children: childIds.join(',')
      }).toString()}`,
      { method: 'POST' },
      { platform: this.platform }
    )
    const creationId = stringOrNull(asRecord(containerRes.json).id)
    if (!creationId) {
      throw new PlatformPublishError('Instagram carousel container failed', {
        platform: this.platform,
        status: containerRes.status,
        retryable: false,
        body: containerRes.json
      })
    }

    const publishRes = await platformFetch(
      `${GRAPH}/${igUserId}/media_publish?${new URLSearchParams({ access_token: credential.accessToken, creation_id: creationId }).toString()}`,
      { method: 'POST' },
      { platform: this.platform }
    )
    const publishBody = asRecord(publishRes.json)
    const mediaId = stringOrNull(publishBody.id)
    if (!mediaId) {
      throw new PlatformPublishError('Instagram carousel publish failed', { platform: this.platform, status: publishRes.status, retryable: true, body: publishBody })
    }
    return {
      platformPostId: mediaId,
      platformPostUrl: await this.fetchPermalink(credential, mediaId),
      rawResponse: publishBody
    }
  }

  private async waitForReelReady(credential: PlatformCredential, creationId: string): Promise<void> {
    const deadline = Date.now() + 180_000
    while (Date.now() < deadline) {
      const res = await platformFetch(
        `${GRAPH}/${creationId}?${new URLSearchParams({ access_token: credential.accessToken, fields: 'status_code' }).toString()}`,
        { method: 'GET' },
        { platform: this.platform }
      )
      const body = asRecord(res.json)
      const status = stringOrNull(body.status_code)
      if (status === 'FINISHED') return
      if (status === 'ERROR' || status === 'EXPIRED') {
        throw new PlatformPublishError(`Instagram reel upload status=${status}`, { platform: this.platform, status: 422, retryable: false, body })
      }
      await new Promise((r) => setTimeout(r, 4000))
    }
    throw new PlatformPublishError('Instagram reel upload timed out', { platform: this.platform, status: 408, retryable: true })
  }

  private async fetchPermalink(credential: PlatformCredential, mediaId: string): Promise<string | null> {
    try {
      const res = await platformFetch(
        `${GRAPH}/${mediaId}?${new URLSearchParams({ access_token: credential.accessToken, fields: 'permalink' }).toString()}`,
        { method: 'GET' },
        { platform: this.platform }
      )
      return stringOrNull(asRecord(res.json).permalink)
    } catch {
      return null
    }
  }

  async fetchAnalytics(credential: PlatformCredential, platformPostId: string): Promise<PlatformAnalyticsSnapshot> {
    const metrics = 'impressions,reach,likes,comments,shares,saved,video_views'
    const res = await platformFetch(
      `${GRAPH}/${platformPostId}/insights?${new URLSearchParams({ metric: metrics, access_token: credential.accessToken }).toString()}`,
      { method: 'GET' },
      { platform: this.platform }
    )
    const body = asRecord(res.json)
    const data = Array.isArray(body.data) ? body.data : []
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
    for (const entry of data.map(asRecord)) {
      const name = stringOrNull(entry.name)
      const values = Array.isArray(entry.values) ? entry.values.map(asRecord) : []
      const latest = values[values.length - 1]
      const value = latest ? numberOrNull(latest.value) : null
      if (!name) continue
      if (name === 'reach') snapshot.reach = value
      else if (name === 'impressions') snapshot.impressions = value
      else if (name === 'likes') snapshot.likes = value
      else if (name === 'comments') snapshot.comments = value
      else if (name === 'shares') snapshot.shares = value
      else if (name === 'saved') snapshot.saves = value
      else if (name === 'video_views') snapshot.videoViews = value
    }
    return snapshot
  }
}
