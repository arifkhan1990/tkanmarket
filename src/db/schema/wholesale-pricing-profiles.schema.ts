import { sql } from 'drizzle-orm'
import { pgTable, integer, numeric, jsonb, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'

import { fabrics } from './fabrics.schema'
import type { WholesalePricingSimulatorParams, WholesalePricingTierRow } from '@/types/wholesale-pricing.types'

export const wholesalePricingProfiles = pgTable(
  'wholesale_pricing_profiles',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    fabricId: integer('fabric_id')
      .notNull()
      .references(() => fabrics.id, { onDelete: 'restrict' }),
    tiers: jsonb('tiers')
      .$type<WholesalePricingTierRow[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    simBaseUnitCostUsd: numeric('sim_base_unit_cost_usd', { precision: 12, scale: 4 }),
    simMinTargetMarginPercent: numeric('sim_min_target_margin_percent', { precision: 6, scale: 2 }),
    simVolumeDecayFactor: numeric('sim_volume_decay_factor', { precision: 6, scale: 4 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    wholesalePricingProfilesFabricIdUq: uniqueIndex('wholesale_pricing_profiles_fabric_id_uq').on(table.fabricId),
    wholesalePricingProfilesFabricIdIdx: index('wholesale_pricing_profiles_fabric_id_idx').on(table.fabricId),
    wholesalePricingProfilesDeletedAtIdx: index('wholesale_pricing_profiles_deleted_at_idx').on(table.deletedAt)
  })
)
