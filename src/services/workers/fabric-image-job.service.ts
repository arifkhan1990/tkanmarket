import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { SocialService } from '@/services/social.service'

function uniqStrings(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of values) {
    const trimmed = v.trim()
    if (!trimmed) continue
    if (seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out
}

export class FabricImageJobService {
  public static async attachImages(params: { fabricId: number; imageUrls: string[] }): Promise<void> {
    const db = getDb()
    try {
      const rows = await db
        .select({ images: fabrics.images })
        .from(fabrics)
        .where(and(eq(fabrics.id, params.fabricId), isNull(fabrics.deletedAt)))
        .limit(1)

      const current = rows[0]?.images ?? []
      const merged = uniqStrings([...current, ...(params.imageUrls ?? [])])

      await db
        .update(fabrics)
        .set({
          images: merged,
          updatedAt: new Date()
        })
        .where(and(eq(fabrics.id, params.fabricId), isNull(fabrics.deletedAt)))

      await SocialService.recomputeSocialScore(params.fabricId).catch(() => {})
    } catch (err) {
      throw err
    }
  }
}

