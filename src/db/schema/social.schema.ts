import { pgEnum, pgTable, text, integer, timestamp, jsonb, boolean, index, unique, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

import { fabrics } from './fabrics.schema'
import { users } from './users.schema'

export const socialPlatformEnum = pgEnum('social_platform', [
  'INSTAGRAM',
  'TIKTOK',
  'PINTEREST',
  'FACEBOOK',
  'YOUTUBE'
])

export const socialPostStatusEnum = pgEnum('social_post_status', [
  'DRAFT',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHED',
  'FAILED',
  'VIDEO_PENDING'
])

export const socialContentTypeEnum = pgEnum('social_content_type', [
  'REEL_5',
  'REEL_8',
  'REEL_10',
  'CAROUSEL',
  'IMAGE_POST',
  'PIN'
])

export const socialCampaignStatusEnum = pgEnum('social_campaign_status', [
  'PLANNING',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'ARCHIVED'
])

export const socialCampaigns = pgTable(
  'social_campaigns',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    status: socialCampaignStatusEnum('status').notNull().default('PLANNING'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    createdByUserId: integer('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    socialCampaignsStatusIdx: index('social_campaigns_status_idx').on(table.status, table.deletedAt),
    socialCampaignsStartsAtIdx: index('social_campaigns_starts_at_idx').on(table.startsAt),
    socialCampaignsCreatedByIdx: index('social_campaigns_created_by_idx').on(table.createdByUserId)
  })
)

export const socialPosts = pgTable(
  'social_posts',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    fabricId: integer('fabric_id')
      .notNull()
      .references(() => fabrics.id, { onDelete: 'cascade' }),

    campaignId: integer('campaign_id').references(() => socialCampaigns.id, { onDelete: 'set null' }),

    platform: socialPlatformEnum('platform').notNull(),
    contentType: socialContentTypeEnum('content_type').notNull(),
    status: socialPostStatusEnum('status').notNull().default('DRAFT'),

    captionText: text('caption_text'),
    hashtags: text('hashtags').array(),
    scriptText: text('script_text'),
    mediaUrls: text('media_urls').array(),
    platformMediaVariants: jsonb('platform_media_variants').$type<Record<string, string[]>>(),
    platformMetadata: jsonb('platform_metadata').$type<Record<string, unknown>>(),

    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    platformPostId: text('platform_post_id'),
    platformPostUrl: text('platform_post_url'),

    reach: integer('reach'),
    impressions: integer('impressions'),
    likes: integer('likes'),
    comments: integer('comments'),
    shares: integer('shares'),
    saves: integer('saves'),
    linkClicks: integer('link_clicks'),
    videoViews: integer('video_views'),
    analyticsSyncedAt: timestamp('analytics_synced_at', { withTimezone: true }),

    publishAttempts: integer('publish_attempts').notNull().default(0),
    lastPublishErrorAt: timestamp('last_publish_error_at', { withTimezone: true }),
    errorMessage: text('error_message'),

    approvedByUserId: integer('approved_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    scheduledByUserId: integer('scheduled_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    publishedByUserId: integer('published_by_user_id').references(() => users.id, { onDelete: 'set null' }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    socialPostsStatusScheduledAtIdx: index('social_posts_status_scheduled_at_idx').on(table.status, table.scheduledAt),
    socialPostsFabricIdIdx: index('social_posts_fabric_id_idx').on(table.fabricId),
    socialPostsCampaignIdIdx: index('social_posts_campaign_id_idx').on(table.campaignId),
    socialPostsPlatformStatusIdx: index('social_posts_platform_status_idx').on(table.platform, table.status),
    socialPostsApprovedByIdx: index('social_posts_approved_by_idx').on(table.approvedByUserId),
    socialPostsScheduledByIdx: index('social_posts_scheduled_by_idx').on(table.scheduledByUserId),
    socialPostsPublishedByIdx: index('social_posts_published_by_idx').on(table.publishedByUserId),
    socialPostsAnalyticsSyncedIdx: index('social_posts_analytics_synced_idx').on(table.publishedAt, table.analyticsSyncedAt),
    socialPostsActiveUq: uniqueIndex('social_posts_active_uq').on(table.fabricId, table.platform).where(sql`${table.status} <> 'PUBLISHED' AND ${table.deletedAt} IS NULL`)
  })
)

export const socialPlatformCredentials = pgTable(
  'social_platform_credentials',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    platform: socialPlatformEnum('platform').notNull(),
    accountId: text('account_id').notNull(),
    accountName: text('account_name'),
    accountUsername: text('account_username'),
    avatarUrl: text('avatar_url'),
    accessTokenEncrypted: text('access_token_encrypted').notNull(),
    refreshTokenEncrypted: text('refresh_token_encrypted'),
    tokenType: text('token_type'),
    scopes: text('scopes').array(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
    refreshFailureCount: integer('refresh_failure_count').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    socialCredentialsUserPlatformUq: unique('social_platform_credentials_user_platform_account_uq').on(table.userId, table.platform, table.accountId),
    socialCredentialsUserIdx: index('social_platform_credentials_user_idx').on(table.userId),
    socialCredentialsPlatformActiveIdx: index('social_platform_credentials_platform_active_idx').on(table.platform, table.isActive, table.deletedAt),
    socialCredentialsExpiresAtIdx: index('social_platform_credentials_expires_at_idx').on(table.expiresAt)
  })
)

export const socialOauthStates = pgTable(
  'social_oauth_states',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    state: text('state').notNull().unique(),
    codeVerifier: text('code_verifier'),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    platform: socialPlatformEnum('platform').notNull(),
    redirectUri: text('redirect_uri').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    socialOauthStatesUserIdx: index('social_oauth_states_user_idx').on(table.userId),
    socialOauthStatesExpiresIdx: index('social_oauth_states_expires_idx').on(table.expiresAt)
  })
)

export const socialPostAnalyticsHistory = pgTable(
  'social_post_analytics_history',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    postId: integer('post_id')
      .notNull()
      .references(() => socialPosts.id, { onDelete: 'cascade' }),
    reach: integer('reach'),
    impressions: integer('impressions'),
    likes: integer('likes'),
    comments: integer('comments'),
    shares: integer('shares'),
    saves: integer('saves'),
    linkClicks: integer('link_clicks'),
    videoViews: integer('video_views'),
    rawPayload: jsonb('raw_payload').$type<Record<string, unknown>>(),
    capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    socialAnalyticsHistoryPostIdx: index('social_post_analytics_history_post_idx').on(table.postId, table.capturedAt)
  })
)

export const socialActivityActionEnum = pgEnum('social_activity_action', [
  'CREATED',
  'UPDATED',
  'APPROVED',
  'SCHEDULED',
  'UNSCHEDULED',
  'PUBLISHED',
  'FAILED',
  'REJECTED',
  'REOPENED',
  'ANALYTICS_SYNCED',
  'CREDENTIALS_CONNECTED',
  'CREDENTIALS_DISCONNECTED',
  'CREDENTIALS_REFRESHED'
])

export const socialActivityLog = pgTable(
  'social_activity_log',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    postId: integer('post_id').references(() => socialPosts.id, { onDelete: 'cascade' }),
    credentialId: integer('credential_id').references(() => socialPlatformCredentials.id, { onDelete: 'set null' }),
    campaignId: integer('campaign_id').references(() => socialCampaigns.id, { onDelete: 'set null' }),
    action: socialActivityActionEnum('action').notNull(),
    actorUserId: integer('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    details: jsonb('details').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    socialActivityPostIdx: index('social_activity_log_post_idx').on(table.postId, table.createdAt),
    socialActivityCampaignIdx: index('social_activity_log_campaign_idx').on(table.campaignId, table.createdAt),
    socialActivityActorIdx: index('social_activity_log_actor_idx').on(table.actorUserId, table.createdAt)
  })
)
