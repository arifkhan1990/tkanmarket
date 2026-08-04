import { getDb } from '@/db'
import { generatedMedia } from '@/db/schema/generated-media.schema'
import { resolveR2Url } from '@/lib/storage/r2'
import { and, eq, isNull, ne } from 'drizzle-orm'
import { AdminFabricService } from '@/services/admin-fabric.service'
import type { FabricDraftPreviewChecklistItem, FabricDraftPreviewResponse, GeneratedMediaItem } from '@/types/admin-fabric-draft-preview.types'

function hasSustainabilityHint(fabric: FabricDraftPreviewResponse['fabric']): boolean {
  const tags = fabric.tags ?? []
  const tagsEn = fabric.tags_en ?? []
  const blob = `${fabric.description_ru ?? ''} ${fabric.description_en ?? ''}`.toLowerCase()
  return [...tags, ...tagsEn].some((t) => /eco|gots|oeko|organic|recycle/i.test(t)) || /gots|oeko|organic|recycled/i.test(blob)
}

function mapMediaRow(row: typeof generatedMedia.$inferSelect): GeneratedMediaItem {
  return {
    id: row.id,
    type: row.type as 'image' | 'video',
    mediaType: row.mediaType,
    url: resolveR2Url(row.url),
    thumbnailUrl: resolveR2Url(row.thumbnailUrl),
    prompt: row.prompt,
    status: row.status,
    durationSeconds: row.durationSeconds,
    createdAt: row.createdAt.toISOString()
  }
}

export class AdminFabricDraftPreviewService {
  public static async getById(fabricId: number): Promise<FabricDraftPreviewResponse | null> {
    const fabric = await AdminFabricService.getById(fabricId)
    if (!fabric) return null

    const db = getDb()

    const [imageRows, videoRows] = await Promise.all([
      db
        .select()
        .from(generatedMedia)
        .where(and(eq(generatedMedia.fabricId, fabricId), eq(generatedMedia.type, 'image'), ne(generatedMedia.status, 'FAILED'), isNull(generatedMedia.deletedAt)))
        .orderBy(generatedMedia.createdAt),
      db
        .select()
        .from(generatedMedia)
        .where(and(eq(generatedMedia.fabricId, fabricId), eq(generatedMedia.type, 'video'), ne(generatedMedia.status, 'FAILED'), isNull(generatedMedia.deletedAt)))
        .orderBy(generatedMedia.createdAt)
    ])

    const images = fabric.images ?? []
    const primaryImageUrl = images[0] ?? null
    const secondaryImageUrls = images.slice(1, 4)

    const checklist: FabricDraftPreviewChecklistItem[] = [
      { id: 'c1', labelKey: 'images', done: images.length > 0 },
      { id: 'c2', labelKey: 'price', done: fabric.price_usd != null && fabric.price_usd.trim().length > 0 },
      { id: 'c3', labelKey: 'sustainability', done: hasSustainabilityHint(fabric) },
      { id: 'c4', labelKey: 'composition', done: (fabric.composition ?? []).length > 0 },
      { id: 'c5', labelKey: 'fabricType', done: fabric.fabric_type != null && fabric.fabric_type.trim().length > 0 },
      { id: 'c6', labelKey: 'gsm', done: fabric.gsm != null },
      { id: 'c7', labelKey: 'descriptionEn', done: fabric.description_en != null && fabric.description_en.trim().length > 0 },
      { id: 'c8', labelKey: 'tagsEn', done: (fabric.tags_en ?? []).length > 0 }
    ]

    const displayTitle = fabric.title_en?.trim() || fabric.title_ru

    return {
      fabric,
      checklist,
      displayTitle,
      primaryImageUrl,
      secondaryImageUrls,
      generatedImages: imageRows.map(mapMediaRow),
      generatedVideos: videoRows.map(mapMediaRow)
    }
  }
}
