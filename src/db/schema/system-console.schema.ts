import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex
} from 'drizzle-orm/pg-core'

import { users } from './users.schema'

export const systemLogLevelEnum = pgEnum('system_log_level', ['INFO', 'WARN', 'ERROR', 'CRITICAL'])

export const integrationStatusEnum = pgEnum('integration_status', ['CONNECTED', 'ACTION_REQUIRED', 'INACTIVE'])

export const integrationHealthDotEnum = pgEnum('integration_health_dot', ['OK', 'WARN', 'ERROR'])

export const systemReleaseKindEnum = pgEnum('system_release_kind', ['MAJOR', 'PATCH', 'FEATURE', 'HOTFIX'])

/** Singleton-style app settings (General / Security / Notifications matrix). */
export const platformAppSettings = pgTable(
  'platform_app_settings',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    siteName: text('site_name').notNull().default('TkanMarket Administrator'),
    supportEmail: text('support_email').notNull().default('ops@tkanmarket.com'),
    timezone: text('timezone').notNull().default('UTC'),
    twoFactorRequired: boolean('two_factor_required').notNull().default(true),
    sessionTimeoutMinutes: integer('session_timeout_minutes').notNull().default(30),
    ipWhitelistEnabled: boolean('ip_whitelist_enabled').notNull().default(false),
    notificationMatrixJson: jsonb('notification_matrix_json')
      .notNull()
      .default(sql`'[]'::jsonb`),
    updatedByUserId: integer('updated_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (t) => [index('platform_app_settings_updated_by_user_id_idx').on(t.updatedByUserId)]
)

/** Regional / SKU preferences (singleton row). */
export const platformRegionalPreferences = pgTable('platform_regional_preferences', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  primaryCurrency: text('primary_currency').notNull().default('USD'),
  platformTimezone: text('platform_timezone').notNull().default('UTC'),
  skuPrefixPattern: text('sku_prefix_pattern').notNull().default('MKTP-{{CAT}}-{{YEAR}}'),
  skuSequenceLength: integer('sku_sequence_length').notNull().default(6),
  updatedByUserId: integer('updated_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
})

export const platformTaxRegions = pgTable(
  'platform_tax_regions',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    regionCode: text('region_code').notNull(),
    label: text('label').notNull(),
    description: text('description'),
    ratePercent: numeric('rate_percent', { precision: 8, scale: 4 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (t) => [index('platform_tax_regions_region_code_idx').on(t.regionCode)]
)

export const systemIntegrations = pgTable(
  'system_integrations',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    status: integrationStatusEnum('status').notNull().default('INACTIVE'),
    externalRef: text('external_ref').notNull(),
    iconKey: text('icon_key').notNull().default('hub'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (t) => [uniqueIndex('system_integrations_slug_unique').on(t.slug)]
)

export const systemIntegrationHealthEvents = pgTable(
  'system_integration_health_events',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    integrationId: integer('integration_id')
      .notNull()
      .references(() => systemIntegrations.id, { onDelete: 'cascade' }),
    endpointPath: text('endpoint_path').notNull(),
    responseLabel: text('response_label').notNull(),
    healthDot: integrationHealthDotEnum('health_dot').notNull().default('OK'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (t) => [
    index('system_integration_health_events_integration_id_idx').on(t.integrationId),
    index('system_integration_health_events_occurred_at_idx').on(t.occurredAt)
  ]
)

export const systemTechnicalLogs = pgTable(
  'system_technical_logs',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    level: systemLogLevelEnum('level').notNull(),
    serviceName: text('service_name').notNull(),
    message: text('message').notNull(),
    traceId: text('trace_id').notNull(),
    detailText: text('detail_text'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (t) => [index('system_technical_logs_occurred_at_idx').on(t.occurredAt), index('system_technical_logs_level_idx').on(t.level)]
)

export const systemReleaseEntries = pgTable(
  'system_release_entries',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    versionLabel: text('version_label').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    releaseKind: systemReleaseKindEnum('release_kind').notNull(),
    releasedAt: timestamp('released_at', { withTimezone: true }).notNull(),
    highlightsJson: jsonb('highlights_json').notNull().default(sql`'[]'::jsonb`),
    isFeatured: boolean('is_featured').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (t) => [index('system_release_entries_released_at_idx').on(t.releasedAt)]
)

export const systemMaintenanceConfig = pgTable('system_maintenance_config', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  isEnabled: boolean('is_enabled').notNull().default(false),
  headline: text('headline').notNull().default('Under Maintenance'),
  body: text('body').notNull().default(''),
  scheduledStart: timestamp('scheduled_start', { withTimezone: true }),
  scheduledEnd: timestamp('scheduled_end', { withTimezone: true }),
  migrationProgress: integer('migration_progress').notNull().default(0),
  migrationStepsJson: jsonb('migration_steps_json').notNull().default(sql`'[]'::jsonb`),
  systemIdLabel: text('system_id_label').notNull().default('MKT-OS-7712-B'),
  heroImageUrl: text('hero_image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
})
