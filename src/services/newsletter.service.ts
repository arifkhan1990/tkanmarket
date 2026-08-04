import { and, eq, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { newsletterSubscribers } from '@/db/schema/newsletter-subscribers.schema'
import { logger } from '@/lib/logger'
import type { Locale } from '@/types/i18n.types'

const MAX_EMAIL_LENGTH = 200
const MAX_SOURCE_LENGTH = 60

export type NewsletterSubscribeInput = {
  email: string
  locale: Locale
  source: string
}

export type NewsletterSubscribeResult = {
  /** True when a brand-new row was inserted, false when the email was already
   * subscribed (idempotent re-subscribe). Lets the UI tailor the toast. */
  created: boolean
}

export class NewsletterService {
  /**
   * Idempotent: re-subscribing the same email is a no-op (returns
   * `created: false`). The unique partial index on `LOWER(email) WHERE
   * deleted_at IS NULL` enforces this at the database level.
   */
  public static async subscribe(
    input: NewsletterSubscribeInput
  ): Promise<NewsletterSubscribeResult> {
    const db = getDb()

    const email = input.email.trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH)
    const source = input.source.trim().slice(0, MAX_SOURCE_LENGTH) || 'blog'

    // Check first so we can return a helpful "already subscribed" status
    // without colliding with the unique index.
    const existing = await db
      .select({ id: newsletterSubscribers.id })
      .from(newsletterSubscribers)
      .where(
        and(
          eq(sql`LOWER(${newsletterSubscribers.email})`, email),
          isNull(newsletterSubscribers.deletedAt)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      logger.info('Newsletter re-subscribe attempt', { email, locale: input.locale, source })
      return { created: false }
    }

    try {
      await db.insert(newsletterSubscribers).values({
        email,
        locale: input.locale,
        source
      })
      return { created: true }
    } catch (err) {
      // The unique index races with the SELECT above under load — treat the
      // duplicate as a successful idempotent re-subscribe.
      const message = err instanceof Error ? err.message : String(err)
      if (/duplicate|unique/i.test(message)) {
        return { created: false }
      }
      logger.error('Newsletter subscribe failed', { err, email })
      throw err
    }
  }
}
