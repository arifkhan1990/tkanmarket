import { pgEnum, pgTable, text, integer, timestamp, numeric, index } from 'drizzle-orm/pg-core'

import { suppliers } from './suppliers.schema'

export const bulkOrderStatusEnum = pgEnum('bulk_order_status', [
  'PROCESSING',
  'IN_TRANSIT',
  'DELIVERED',
  'ON_HOLD'
])

export const supplierTierEnum = pgEnum('supplier_tier', ['PLATINUM', 'GOLD', 'SILVER', 'STANDARD'])

export const bulkOrders = pgTable(
  'bulk_orders',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    orderReference: text('order_reference').notNull().unique(),
    buyerCompanyName: text('buyer_company_name').notNull(),

    supplierId: integer('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'restrict' }),

    supplierTier: supplierTierEnum('supplier_tier').notNull().default('STANDARD'),

    totalMeters: numeric('total_meters', { precision: 14, scale: 2 }).notNull(),
    estimatedValueUsd: numeric('estimated_value_usd', { precision: 14, scale: 2 }),

    status: bulkOrderStatusEnum('status').notNull().default('PROCESSING'),

    orderedAt: timestamp('ordered_at', { withTimezone: true }).notNull().defaultNow(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    bulkOrdersSupplierIdIdx: index('bulk_orders_supplier_id_idx').on(table.supplierId),
    bulkOrdersStatusIdx: index('bulk_orders_status_idx').on(table.status),
    bulkOrdersOrderedAtDescIdx: index('bulk_orders_ordered_at_desc_idx').on(table.orderedAt),
    bulkOrdersDeletedAtIdx: index('bulk_orders_deleted_at_idx').on(table.deletedAt)
  })
)
