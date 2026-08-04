import { pgEnum, pgTable, text, integer, boolean, numeric, jsonb, timestamp, index } from 'drizzle-orm/pg-core'

import type { CommissionTierRow } from '@/types/commission-rules.types'

export const commissionTierModeEnum = pgEnum('commission_tier_mode', ['FLAT', 'TIERED'])

export const commissionHealthEnum = pgEnum('commission_health', ['HEALTHY', 'UNDER_REVIEW', 'PAUSED'])

export const commissionRules = pgTable(
  'commission_rules',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    categoryKey: text('category_key').notNull(),
    categoryLabel: text('category_label').notNull(),
    externalRef: text('external_ref'),

    baseCommissionPercent: numeric('base_commission_percent', { precision: 5, scale: 2 }).notNull(),
    minMonthlyVolumeUsd: integer('min_monthly_volume_usd').notNull().default(0),

    tierMode: commissionTierModeEnum('tier_mode').notNull().default('TIERED'),
    health: commissionHealthEnum('health').notNull().default('HEALTHY'),
    isActive: boolean('is_active').notNull().default(true),

    tiers: jsonb('tiers').$type<CommissionTierRow[] | null>(),

    insightTitle: text('insight_title'),
    insightBody: text('insight_body'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    commissionRulesCategoryKeyIdx: index('commission_rules_category_key_idx').on(table.categoryKey),
    commissionRulesDeletedAtIdx: index('commission_rules_deleted_at_idx').on(table.deletedAt)
  })
)
