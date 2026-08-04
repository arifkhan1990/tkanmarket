import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { cookieConsents } from '@/db/schema/cookie-consents.schema'

export class CookieConsentService {
  public static async upsert(params: {
    visitorKey: string
    userId: number | null
    preferences: Record<string, unknown>
  }): Promise<{ id: number }> {
    const db = getDb()

    const existing = await db
      .select({ id: cookieConsents.id })
      .from(cookieConsents)
      .where(and(eq(cookieConsents.visitorKey, params.visitorKey), isNull(cookieConsents.deletedAt)))
      .limit(1)

    if (existing[0]?.id) {
      await db
        .update(cookieConsents)
        .set({
          preferences: params.preferences,
          userId: params.userId,
          updatedAt: new Date()
        })
        .where(eq(cookieConsents.id, existing[0].id))
      return { id: existing[0].id }
    }

    const [row] = await db
      .insert(cookieConsents)
      .values({
        visitorKey: params.visitorKey,
        userId: params.userId,
        preferences: params.preferences,
        updatedAt: new Date(),
        deletedAt: null
      })
      .returning({ id: cookieConsents.id })

    if (!row?.id) throw new Error('Failed to save consent')
    return { id: row.id }
  }
}
