import {
  pgTable, integer, text, timestamptz, pgEnum, index,
} from 'drizzle-orm/pg-core'
import { fabrics } from './fabrics.schema'

export const socialPlatformEnum = pgEnum('social_platform', [
  'INSTAGRAM', 'TIKTOK', 'PINTEREST', 'FACEBOOK', 'YOUTUBE',
])

export const socialPostStatusEnum = pgEnum('social_post_status', [
  'DRAFT', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED',
])

export const socialContentTypeEnum = pgEnum('social_content_type', [
  'REEL_15', 'REEL_20', 'REEL_30', 'CAROUSEL', 'IMAGE_POST', 'PIN',
])

export const socialPosts = pgTable('social_posts', {
  id:             integer('id').generatedAlwaysAsIdentity().primaryKey(),
  fabricId:       integer('fabric_id').notNull().references(() => fabrics.id, { onDelete: 'cascade' }),
  platform:       socialPlatformEnum('platform').notNull(),
  contentType:    socialContentTypeEnum('content_type').notNull(),
  status:         socialPostStatusEnum('status').notNull().default('DRAFT'),

  captionText:    text('caption_text'),
  hashtags:       text('hashtags').array(),
  scriptText:     text('script_text'),
  mediaUrls:      text('media_urls').array(),

  scheduledAt:    timestamptz('scheduled_at'),
  publishedAt:    timestamptz('published_at'),
  platformPostId: text('platform_post_id'),

  // Analytics (synced from platform APIs)
  reach:          integer('reach'),
  likes:          integer('likes'),
  shares:         integer('shares'),
  linkClicks:     integer('link_clicks'),

  errorMessage:   text('error_message'),
  createdAt:      timestamptz('created_at').notNull().defaultNow(),
  updatedAt:      timestamptz('updated_at').notNull().defaultNow(),
}, (table) => ({
  fabricIdx:     index('social_posts_fabric_id_idx').on(table.fabricId),
  statusIdx:     index('social_posts_status_idx').on(table.status),
  scheduledIdx:  index('social_posts_scheduled_at_idx').on(table.scheduledAt),
  platformIdx:   index('social_posts_platform_idx').on(table.platform),
}))

export type SocialPost    = typeof socialPosts.$inferSelect
export type NewSocialPost = typeof socialPosts.$inferInsert
