import { pgTable, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core'

import { fabrics } from './fabrics.schema'
import { users } from './users.schema'

/**
 * Tracks ALL AI-generated images and videos in one table.
 * Polymorphic: type = 'image' | 'video'
 * Per the implementation plan: single table, not separate tables per media type.
 */
export const generatedMedia = pgTable(
  'generated_media',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    fabricId: integer('fabric_id')
      .notNull()
      .references(() => fabrics.id, { onDelete: 'cascade' }),
    socialPostId: integer('social_post_id'), // link to social post if created from admin video flow

    type: text('type').notNull(),           // 'image' | 'video'
    mediaType: text('media_type'),          // 'IMAGE_1:1', 'IMAGE_9:16', 'REEL_5', 'REEL_8', 'REEL_10'

    url: text('url'),                        // R2 URL after generation (or GCS URI)
    thumbnailUrl: text('thumbnail_url'),     // thumbnail for video
    prompt: text('prompt').notNull(),        // full prompt used

    provider: text('provider').notNull().default('gemini'),  // 'gemini' | 'veo'
    providerModel: text('provider_model'),   // model name used
    providerJobId: text('provider_job_id'),

    status: text('status').notNull().default('PENDING'),
    // PENDING → PROCESSING → COMPLETED | FAILED → SUPERSEDED (replaced by a newer version)

    supersededByMediaId: integer('superseded_by_media_id'), // media row that replaced this version (lineage)

    durationSeconds: integer('duration_seconds'),          // video only
    aspectRatio: text('aspect_ratio'),
    fileSizeBytes: integer('file_size_bytes'),            // bytes

    errorMessage: text('error_message'),

    adminReviewedAt: timestamp('admin_reviewed_at', { withTimezone: true }),
    adminReviewerId: integer('admin_reviewer_id').references(() => users.id, { onDelete: 'set null' }),
    adminReviewNotes: text('admin_review_notes'),

    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    expiresAt: timestamp('expires_at', { withTimezone: true }),  // auto-cleanup old media

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    generatedMediaFabricIdIdx: index('generated_media_fabric_id_idx').on(table.fabricId),
    generatedMediaStatusIdx: index('generated_media_status_idx').on(table.status),
    generatedMediaTypeIdx: index('generated_media_type_idx').on(table.type),
    generatedMediaSocialPostIdIdx: index('generated_media_social_post_id_idx').on(table.socialPostId),
    generatedMediaSupersededByIdx: index('generated_media_superseded_by_idx').on(table.supersededByMediaId)
  })
)
