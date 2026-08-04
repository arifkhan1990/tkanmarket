import { and, count, desc, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { generatedMedia } from '@/db/schema/generated-media.schema'
import { fabricActivityLog } from '@/db/schema/fabric-activity-log.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { logger } from '@/lib/logger'

type InteractionEvent = 'view' | 'click' | 'share'

export class MediaABTestService {
  static async createTestVariants(fabricId: number, count: number = 2): Promise<number[]> {
    const db = getDb()
    const mediaIds: number[] = []

    const rows = await db
      .select({ id: fabrics.id, titleEn: fabrics.titleEn, titleRu: fabrics.titleRu })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)

    const fabric = rows[0]
    if (!fabric) throw new Error('Fabric not found')

    const variantPrompts = [
      `Studio product shot of ${fabric.titleEn ?? fabric.titleRu ?? 'fabric'}. White background, clean lighting, e-commerce style.`,
      `Lifestyle shot of ${fabric.titleEn ?? fabric.titleRu ?? 'fabric'}. Natural lighting, contextual setting, editorial style.`,
      `Close-up macro shot of ${fabric.titleEn ?? fabric.titleRu ?? 'fabric'}. Weave texture visible, dramatic lighting, textile detail.`
    ]

    const prompts = variantPrompts.slice(0, count)

    for (const prompt of prompts) {
      const [inserted] = await db
        .insert(generatedMedia)
        .values({
          fabricId,
          type: 'image',
          mediaType: 'IMAGE_1:1',
          prompt,
          status: 'PENDING',
          provider: 'gemini',
          providerModel: 'imagen-3.0-generate-001',
          metadata: { abTestVariant: true, variantGroup: `ab_test_${fabricId}` }
        })
        .returning({ id: generatedMedia.id })

      if (inserted) mediaIds.push(inserted.id)
    }

    await db.insert(fabricActivityLog).values({
      fabricId,
      actorId: null,
      eventType: 'AB_TEST_VARIANTS_CREATED',
      message: `Created ${mediaIds.length} A/B test variants`,
      payload: { mediaIds, variantCount: mediaIds.length },
      updatedAt: new Date()
    })

    logger.info('A/B test variants created', { fabricId, mediaIds })
    return mediaIds
  }

  static async recordInteraction(mediaId: number, event: InteractionEvent): Promise<void> {
    const db = getDb()

    const rows = await db
      .select({ id: generatedMedia.id, fabricId: generatedMedia.fabricId, metadata: generatedMedia.metadata })
      .from(generatedMedia)
      .where(eq(generatedMedia.id, mediaId))
      .limit(1)

    const media = rows[0]
    if (!media) return

    const metadata = (media.metadata ?? {}) as Record<string, unknown>
    const interactions = (metadata.interactions as Record<string, number>) ?? {}
    interactions[event] = (interactions[event] ?? 0) + 1

    await db
      .update(generatedMedia)
      .set({
        metadata: { ...metadata, interactions },
        updatedAt: new Date()
      })
      .where(eq(generatedMedia.id, mediaId))

    logger.debug('A/B test interaction recorded', { mediaId, event, total: interactions[event] })
  }

  static async getWinner(fabricId: number): Promise<number | null> {
    const db = getDb()

    const variants = await db
      .select({
        id: generatedMedia.id,
        metadata: generatedMedia.metadata
      })
      .from(generatedMedia)
      .where(
        and(
          eq(generatedMedia.fabricId, fabricId),
          eq(generatedMedia.type, 'image'),
          eq(generatedMedia.status, 'COMPLETED'),
          isNull(generatedMedia.deletedAt)
        )
      )

    if (variants.length < 2) return null

    let bestId: number | null = null
    let bestScore = -1

    for (const v of variants) {
      const meta = (v.metadata ?? {}) as Record<string, unknown>
      const interactions = (meta.interactions as Record<string, number>) ?? {}
      const score = (interactions.view ?? 0) + (interactions.click ?? 0) * 3 + (interactions.share ?? 0) * 5
      if (score > bestScore) {
        bestScore = score
        bestId = v.id
      }
    }

    return bestId
  }
}
