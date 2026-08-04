import { sql } from 'drizzle-orm'
import {
  pgEnum,
  pgTable,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  jsonb,
  index
} from 'drizzle-orm/pg-core'

import { suppliers } from './suppliers.schema'
import { fabrics } from './fabrics.schema'

export const supplierReviewStatusEnum = pgEnum('supplier_review_status', [
  'PENDING',
  'APPROVED',
  'FLAGGED',
  'REJECTED'
])

export const supplierPayoutStatusEnum = pgEnum('supplier_payout_status', [
  'PENDING',
  'REVIEWING',
  'APPROVED',
  'REJECTED',
  'PAID'
])

export const supplierVerificationCaseStatusEnum = pgEnum('supplier_verification_case_status', [
  'DRAFT',
  'IN_PROGRESS',
  'COMPLETED'
])

export const supplierReviews = pgTable(
  'supplier_reviews',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    supplierId: integer('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'restrict' }),
    fabricId: integer('fabric_id').references(() => fabrics.id, { onDelete: 'set null' }),
    reviewerDisplayName: text('reviewer_display_name').notNull(),
    reviewerBadge: text('reviewer_badge'),
    isAnonymous: boolean('is_anonymous').notNull().default(false),
    rating: integer('rating').notNull(),
    body: text('body').notNull(),
    skuSnapshot: text('sku_snapshot'),
    status: supplierReviewStatusEnum('status').notNull().default('PENDING'),
    flagReason: text('flag_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    supplierReviewsSupplierIdIdx: index('supplier_reviews_supplier_id_idx').on(table.supplierId),
    supplierReviewsFabricIdIdx: index('supplier_reviews_fabric_id_idx').on(table.fabricId),
    supplierReviewsStatusIdx: index('supplier_reviews_status_idx').on(table.status)
  })
)

export const supplierVerificationCases = pgTable(
  'supplier_verification_cases',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    supplierId: integer('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'restrict' }),
    referenceCode: text('reference_code').notNull().unique(),
    headline: text('headline').notNull(),
    summary: text('summary').notNull(),
    complianceScore: integer('compliance_score').notNull().default(0),
    laborPct: integer('labor_pct').notNull().default(0),
    envPct: integer('env_pct').notNull().default(0),
    supplyPct: integer('supply_pct').notNull().default(0),
    fiscalPct: integer('fiscal_pct').notNull().default(0),
    status: supplierVerificationCaseStatusEnum('status').notNull().default('IN_PROGRESS'),
    checklistJson: jsonb('checklist_json').notNull().default(sql`'[]'::jsonb`),
    messagesJson: jsonb('messages_json').notNull().default(sql`'[]'::jsonb`),
    facilityPhotoUrls: text('facility_photo_urls').array(),
    internalNote: text('internal_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    supplierVerificationCasesSupplierIdIdx: index('supplier_verification_cases_supplier_id_idx').on(
      table.supplierId
    )
  })
)

export const supplierPayoutRequests = pgTable(
  'supplier_payout_requests',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    supplierId: integer('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'restrict' }),
    requestedAmount: numeric('requested_amount', { precision: 14, scale: 2 }).notNull(),
    balanceSnapshot: numeric('balance_snapshot', { precision: 14, scale: 2 }).notNull(),
    bankLabel: text('bank_label').notNull(),
    accountMask: text('account_mask').notNull(),
    swiftCode: text('swift_code'),
    status: supplierPayoutStatusEnum('status').notNull().default('PENDING'),
    resolutionNote: text('resolution_note'),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    supplierPayoutRequestsSupplierIdIdx: index('supplier_payout_requests_supplier_id_idx').on(
      table.supplierId
    ),
    supplierPayoutRequestsStatusIdx: index('supplier_payout_requests_status_idx').on(table.status)
  })
)

export const systemAlertMonitors = pgTable(
  'system_alert_monitors',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    monitorKey: text('monitor_key').notNull().unique(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    thresholdInt: integer('threshold_int'),
    accent: text('accent').notNull().default('primary'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    systemAlertMonitorsEnabledIdx: index('system_alert_monitors_enabled_idx').on(table.enabled)
  })
)

export const systemAlertChannels = pgTable(
  'system_alert_channels',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    channelKey: text('channel_key').notNull().unique(),
    label: text('label').notNull(),
    subtitle: text('subtitle').notNull(),
    enabled: boolean('enabled').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    systemAlertChannelsEnabledIdx: index('system_alert_channels_enabled_idx').on(table.enabled)
  })
)

export const systemAlertPerformanceLogs = pgTable(
  'system_alert_performance_logs',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    monitorKey: text('monitor_key').notNull(),
    label: text('label').notNull(),
    workerHint: text('worker_hint').notNull(),
    avgLoadMs: integer('avg_load_ms').notNull().default(0),
    status: text('status').notNull(),
    lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    systemAlertPerfLogsMonitorKeyIdx: index('system_alert_perf_logs_monitor_key_idx').on(
      table.monitorKey
    )
  })
)
