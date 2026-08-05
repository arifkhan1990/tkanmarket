import { sql } from 'drizzle-orm'
import { pgTable, integer, boolean, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const adminSettings = pgTable('admin_settings', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  crawlerEnabled: boolean('crawler_enabled').notNull().default(true),
  crawlerDefaultMaxProducts: integer('crawler_default_max_products').notNull().default(200),
  leadRateLimitPerHour: integer('lead_rate_limit_per_hour').notNull().default(5),
  notificationEmail: text('notification_email'),
  leadOpsJson: jsonb('lead_ops_json').notNull().default(sql`'{}'::jsonb`),
  systemAlertsJson: jsonb('system_alerts_json').notNull().default(sql`'{}'::jsonb`),
  socialMediaPolicyJson: jsonb('social_media_policy_json').notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
})

