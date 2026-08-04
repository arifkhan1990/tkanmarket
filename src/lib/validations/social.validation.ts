import { z } from 'zod'

import {
  REEL_DURATIONS,
  SOCIAL_CAMPAIGN_STATUS,
  SOCIAL_CONTENT_TYPE,
  SOCIAL_PLATFORM,
  SOCIAL_POST_STATUS
} from '@/constants'

export const SocialPlatformSchema = z.enum(SOCIAL_PLATFORM)
export const SocialPostStatusSchema = z.enum(SOCIAL_POST_STATUS)
export const SocialContentTypeSchema = z.enum(SOCIAL_CONTENT_TYPE)
export const SocialCampaignStatusSchema = z.enum(SOCIAL_CAMPAIGN_STATUS)

/** Reel/short video duration in seconds — restricted to the 3 allowed variants (5s, 8s, 10s). */
export const VideoDurationSchema = z.union(
  REEL_DURATIONS.map((d) => z.literal(d)) as unknown as [z.ZodLiteral<5>, z.ZodLiteral<8>, z.ZodLiteral<10>]
)

export type SocialPlatformInput = z.infer<typeof SocialPlatformSchema>
export type SocialPostStatusInput = z.infer<typeof SocialPostStatusSchema>
export type SocialContentTypeInput = z.infer<typeof SocialContentTypeSchema>
export type VideoDurationInput = z.infer<typeof VideoDurationSchema>

const HASHTAG_REGEX = /^[A-Za-z0-9_\u00C0-\u024F\u0400-\u04FF]+$/

export const HashtagSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .transform((raw) => (raw.startsWith('#') ? raw : `#${raw}`))
  .superRefine((value, ctx) => {
    const body = value.slice(1)
    if (!HASHTAG_REGEX.test(body)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hashtag may only contain letters, digits and underscores.'
      })
    }
  })

export const HashtagsArraySchema = z.array(HashtagSchema).max(40)

export const CaptionSchema = z.string().trim().min(1).max(8000)

const MediaUrlSchema = z.string().trim().url().max(2048)
export const MediaUrlsSchema = z.array(MediaUrlSchema).min(0).max(20)

const FutureDateSchema = z
  .string()
  .datetime({ offset: true })
  .refine((value) => new Date(value).getTime() > Date.now() + 30_000, {
    message: 'scheduled_at must be at least 30 seconds in the future'
  })

export const CreateDraftSchema = z.object({
  fabric_id: z.coerce.number().int().positive(),
  platform: SocialPlatformSchema,
  content_type: SocialContentTypeSchema.optional(),
  caption_text: CaptionSchema.optional(),
  hashtags: HashtagsArraySchema.optional(),
  script_text: z.string().trim().max(8000).optional(),
  media_urls: MediaUrlsSchema.optional(),
  campaign_id: z.coerce.number().int().positive().nullable().optional()
})
export type CreateDraftInput = z.infer<typeof CreateDraftSchema>

export const AiBatchSchema = z.object({
  platform: SocialPlatformSchema,
  count: z.coerce.number().int().min(1).max(50),
  content_type: SocialContentTypeSchema.optional()
})
export type AiBatchInput = z.infer<typeof AiBatchSchema>

export const UpdatePostSchema = z
  .object({
    caption_text: CaptionSchema.nullable().optional(),
    hashtags: HashtagsArraySchema.nullable().optional(),
    script_text: z.string().trim().max(8000).nullable().optional(),
    media_urls: MediaUrlsSchema.nullable().optional(),
    campaign_id: z.coerce.number().int().positive().nullable().optional()
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one field required' })
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>

export const SchedulePostSchema = z.object({
  scheduled_at: FutureDateSchema
})
export type SchedulePostInput = z.infer<typeof SchedulePostSchema>

export const ListPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  platform: SocialPlatformSchema.optional(),
  status: SocialPostStatusSchema.optional(),
  campaign_id: z.coerce.number().int().positive().optional(),
  fabric_id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(200).optional()
})
export type ListPostsQuery = z.infer<typeof ListPostsQuerySchema>

export const BulkIdsSchema = z.object({
  post_ids: z.array(z.coerce.number().int().positive()).min(1).max(500)
})
export type BulkIdsInput = z.infer<typeof BulkIdsSchema>

export const BulkScheduleSchema = z.object({
  post_ids: z.array(z.coerce.number().int().positive()).min(1).max(500),
  scheduled_at: FutureDateSchema
})
export type BulkScheduleInput = z.infer<typeof BulkScheduleSchema>

export const CreateCampaignSchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    description: z.string().trim().max(5000).optional(),
    status: SocialCampaignStatusSchema.optional(),
    starts_at: z.string().datetime({ offset: true }).optional(),
    ends_at: z.string().datetime({ offset: true }).optional()
  })
  .superRefine((value, ctx) => {
    if (value.starts_at && value.ends_at) {
      if (new Date(value.ends_at).getTime() <= new Date(value.starts_at).getTime()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'ends_at must be after starts_at', path: ['ends_at'] })
      }
    }
  })
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>

export const UpdateCampaignSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    status: SocialCampaignStatusSchema.optional(),
    starts_at: z.string().datetime({ offset: true }).nullable().optional(),
    ends_at: z.string().datetime({ offset: true }).nullable().optional()
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one field required' })
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>

export const OAuthInitiateSchema = z.object({
  platform: SocialPlatformSchema
})

export const OAuthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  error: z.string().optional(),
  error_description: z.string().optional()
})

export const DisconnectSchema = z.object({
  credential_id: z.coerce.number().int().positive()
})

export const ListIntegrationsQuerySchema = z.object({
  platform: SocialPlatformSchema.optional(),
  include_inactive: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .transform((v) => v === true || v === 'true')
    .optional()
})
export type ListIntegrationsQuery = z.infer<typeof ListIntegrationsQuerySchema>

export const WebhookInstagramSubscribeSchema = z.object({
  'hub.mode': z.string(),
  'hub.challenge': z.string(),
  'hub.verify_token': z.string()
})

export const AnalyticsSummaryQuerySchema = z.object({
  platform: SocialPlatformSchema.optional(),
  campaign_id: z.coerce.number().int().positive().optional(),
  since: z.string().datetime({ offset: true }).optional(),
  until: z.string().datetime({ offset: true }).optional()
})
export type AnalyticsSummaryQuery = z.infer<typeof AnalyticsSummaryQuerySchema>
