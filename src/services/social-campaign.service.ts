import { and, desc, eq, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { socialActivityLog, socialCampaigns, socialPosts } from '@/db/schema/social.schema'
import { NotFoundError } from '@/lib/errors'

import type { SOCIAL_CAMPAIGN_STATUS } from '@/constants'

type CampaignStatus = (typeof SOCIAL_CAMPAIGN_STATUS)[number]

export interface CampaignSummary {
  id: number
  name: string
  description: string | null
  status: CampaignStatus
  startsAt: string | null
  endsAt: string | null
  createdByUserId: number
  createdAt: string
  updatedAt: string
  postCount: number
  publishedCount: number
  scheduledCount: number
}

export class SocialCampaignService {
  public static async create(input: {
    name: string
    description?: string
    status?: CampaignStatus
    startsAt?: Date | null
    endsAt?: Date | null
    createdByUserId: number
  }): Promise<{ id: number }> {
    const db = getDb()
    const rows = await db
      .insert(socialCampaigns)
      .values({
        name: input.name,
        description: input.description ?? null,
        status: input.status ?? 'PLANNING',
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
        createdByUserId: input.createdByUserId,
        updatedAt: new Date()
      })
      .returning({ id: socialCampaigns.id })
    const row = rows[0]
    if (!row) throw new NotFoundError('Campaign create failed')
    return row
  }

  public static async update(
    id: number,
    input: {
      name?: string
      description?: string | null
      status?: CampaignStatus
      startsAt?: Date | null
      endsAt?: Date | null
    }
  ): Promise<void> {
    const db = getDb()
    const patch: Partial<typeof socialCampaigns.$inferInsert> = { updatedAt: new Date() }
    if (input.name !== undefined) patch.name = input.name
    if (input.description !== undefined) patch.description = input.description
    if (input.status !== undefined) patch.status = input.status
    if (input.startsAt !== undefined) patch.startsAt = input.startsAt
    if (input.endsAt !== undefined) patch.endsAt = input.endsAt
    const updated = await db
      .update(socialCampaigns)
      .set(patch)
      .where(and(eq(socialCampaigns.id, id), isNull(socialCampaigns.deletedAt)))
      .returning({ id: socialCampaigns.id })
    if (updated.length === 0) throw new NotFoundError('Campaign not found')
  }

  public static async softDelete(id: number): Promise<void> {
    const db = getDb()
    const rows = await db
      .update(socialCampaigns)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(socialCampaigns.id, id), isNull(socialCampaigns.deletedAt)))
      .returning({ id: socialCampaigns.id })
    if (rows.length === 0) throw new NotFoundError('Campaign not found')
  }

  public static async list(): Promise<CampaignSummary[]> {
    const db = getDb()
    const rows = await db
      .select({
        id: socialCampaigns.id,
        name: socialCampaigns.name,
        description: socialCampaigns.description,
        status: socialCampaigns.status,
        startsAt: socialCampaigns.startsAt,
        endsAt: socialCampaigns.endsAt,
        createdByUserId: socialCampaigns.createdByUserId,
        createdAt: socialCampaigns.createdAt,
        updatedAt: socialCampaigns.updatedAt,
        postCount: sql<number>`(select count(*) from ${socialPosts} sp where sp.campaign_id = ${socialCampaigns.id} and sp.deleted_at is null)::int`,
        publishedCount: sql<number>`(select count(*) from ${socialPosts} sp where sp.campaign_id = ${socialCampaigns.id} and sp.deleted_at is null and sp.status = 'PUBLISHED')::int`,
        scheduledCount: sql<number>`(select count(*) from ${socialPosts} sp where sp.campaign_id = ${socialCampaigns.id} and sp.deleted_at is null and sp.status = 'SCHEDULED')::int`
      })
      .from(socialCampaigns)
      .where(isNull(socialCampaigns.deletedAt))
      .orderBy(desc(socialCampaigns.createdAt))
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      status: r.status,
      startsAt: r.startsAt ? r.startsAt.toISOString() : null,
      endsAt: r.endsAt ? r.endsAt.toISOString() : null,
      createdByUserId: r.createdByUserId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      postCount: r.postCount,
      publishedCount: r.publishedCount,
      scheduledCount: r.scheduledCount
    }))
  }

  public static async addPosts(params: { campaignId: number; postIds: number[]; actorUserId: number }): Promise<number> {
    if (params.postIds.length === 0) return 0
    const db = getDb()
    const exists = await db.select({ id: socialCampaigns.id }).from(socialCampaigns).where(eq(socialCampaigns.id, params.campaignId)).limit(1)
    if (!exists[0]) throw new NotFoundError('Campaign not found')
    const updated = await db
      .update(socialPosts)
      .set({ campaignId: params.campaignId, updatedAt: new Date() })
      .where(and(isNull(socialPosts.deletedAt), sql`${socialPosts.id} = ANY(${params.postIds})`))
      .returning({ id: socialPosts.id })
    if (updated.length > 0) {
      await db.insert(socialActivityLog).values(
        updated.map((r) => ({
          postId: r.id,
          campaignId: params.campaignId,
          action: 'UPDATED' as const,
          actorUserId: params.actorUserId,
          details: { attachedToCampaign: params.campaignId }
        }))
      )
    }
    return updated.length
  }
}
