import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, boolean, numeric } from 'drizzle-orm/pg-core'

import { users } from './users.schema'

export const supplierDiscoveryRunStatusEnum = pgEnum('supplier_discovery_run_status', [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'PARTIAL'
])

export const supplierDiscoverySupplierStatusEnum = pgEnum('supplier_discovery_supplier_status', [
  'NEW',
  'REVIEW_NEEDED',
  'APPROVED_FOR_INGEST',
  'REJECTED'
])

export const supplierDiscoveryProductStatusEnum = pgEnum('supplier_discovery_product_status', [
  'NEW',
  'READY',
  'NEEDS_REVIEW',
  'REJECTED'
])

export const supplierDiscoveryRuns = pgTable(
  'supplier_discovery_runs',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    status: supplierDiscoveryRunStatusEnum('status').notNull().default('PENDING'),
    sources: text('sources').array().notNull(),
    criteriaJson: jsonb('criteria_json').notNull(),
    keywords: text('keywords').array().notNull(),

    maxSuppliers: integer('max_suppliers').notNull().default(50),
    maxProductsPerSupplier: integer('max_products_per_supplier').notNull().default(10),

    suppliersFound: integer('suppliers_found').notNull().default(0),
    suppliersQualified: integer('suppliers_qualified').notNull().default(0),
    productsExtracted: integer('products_extracted').notNull().default(0),
    draftsReady: integer('drafts_ready').notNull().default(0),

    triggeredById: integer('triggered_by_id').references(() => users.id, { onDelete: 'restrict' }),

    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    errorLog: text('error_log'),
    runNote: text('run_note'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    supplierDiscoveryRunsTriggeredByIdIdx: index('supplier_discovery_runs_triggered_by_id_idx').on(table.triggeredById),
    supplierDiscoveryRunsStatusIdx: index('supplier_discovery_runs_status_idx').on(table.status)
  })
)

export const supplierDiscoverySuppliers = pgTable(
  'supplier_discovery_suppliers',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    runId: integer('run_id')
      .notNull()
      .references(() => supplierDiscoveryRuns.id, { onDelete: 'restrict' }),

    source: text('source').notNull(),
    supplierUrl: text('supplier_url').notNull(),
    supplierUrlHash: text('supplier_url_hash').notNull(),

    name: text('name'),
    logoUrl: text('logo_url'),
    websiteUrl: text('website_url'),
    establishedYear: integer('established_year'),
    city: text('city'),
    province: text('province'),
    country: text('country'),

    yearsInBusiness: integer('years_in_business'),
    catalogSizeEstimate: integer('catalog_size_estimate'),
    moqMinMeters: integer('moq_min_meters'),
    photosScore: numeric('photos_score', { precision: 5, scale: 2 }),

    qualified: boolean('qualified').notNull().default(false),
    qualificationReasons: text('qualification_reasons').array(),

    status: supplierDiscoverySupplierStatusEnum('status').notNull().default('NEW'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    supplierDiscoverySuppliersRunIdIdx: index('supplier_discovery_suppliers_run_id_idx').on(table.runId),
    supplierDiscoverySuppliersRunIdHashUq: uniqueIndex('supplier_discovery_suppliers_run_id_hash_uq').on(
      table.runId,
      table.supplierUrlHash
    ),
    supplierDiscoverySuppliersQualifiedIdx: index('supplier_discovery_suppliers_qualified_idx').on(table.qualified),
    supplierDiscoverySuppliersStatusIdx: index('supplier_discovery_suppliers_status_idx').on(table.status)
  })
)

export const supplierDiscoveryProducts = pgTable(
  'supplier_discovery_products',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    runId: integer('run_id')
      .notNull()
      .references(() => supplierDiscoveryRuns.id, { onDelete: 'restrict' }),

    discoverySupplierId: integer('discovery_supplier_id')
      .notNull()
      .references(() => supplierDiscoverySuppliers.id, { onDelete: 'restrict' }),

    productUrl: text('product_url').notNull(),
    urlHash: text('url_hash').notNull(),

    rawTitle: text('raw_title').notNull(),
    rawDescription: text('raw_description'),
    rawImages: text('raw_images').array(),

    priceText: text('price_text'),
    moqText: text('moq_text'),
    moqMeters: integer('moq_meters'),
    compositionText: text('composition_text'),
    gsmText: text('gsm_text'),
    widthText: text('width_text'),

    photoCount: integer('photo_count').notNull().default(0),
    photoQualityScore: numeric('photo_quality_score', { precision: 5, scale: 2 }),

    status: supplierDiscoveryProductStatusEnum('status').notNull().default('NEW'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    supplierDiscoveryProductsRunIdIdx: index('supplier_discovery_products_run_id_idx').on(table.runId),
    supplierDiscoveryProductsDiscoverySupplierIdIdx: index('supplier_discovery_products_discovery_supplier_id_idx').on(
      table.discoverySupplierId
    ),
    supplierDiscoveryProductsRunIdUrlHashUq: uniqueIndex('supplier_discovery_products_run_id_url_hash_uq').on(
      table.runId,
      table.urlHash
    ),
    supplierDiscoveryProductsStatusIdx: index('supplier_discovery_products_status_idx').on(table.status)
  })
)
