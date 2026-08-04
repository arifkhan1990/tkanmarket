import { pgTable, text, integer, timestamp, index, unique } from 'drizzle-orm/pg-core'

import { users } from './users.schema'
import { fabrics } from './fabrics.schema'

export const buyerWishlistItems = pgTable(
  'buyer_wishlist_items',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    fabricId: integer('fabric_id')
      .notNull()
      .references(() => fabrics.id, { onDelete: 'cascade' }),

    collectionLabel: text('collection_label'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    buyerWishlistUserIdIdx: index('buyer_wishlist_items_user_id_idx').on(table.userId),
    buyerWishlistFabricIdIdx: index('buyer_wishlist_items_fabric_id_idx').on(table.fabricId),
    buyerWishlistDeletedAtIdx: index('buyer_wishlist_items_deleted_at_idx').on(table.deletedAt),
    buyerWishlistUserFabricUq: unique('buyer_wishlist_user_fabric_uq').on(table.userId, table.fabricId)
  })
)
