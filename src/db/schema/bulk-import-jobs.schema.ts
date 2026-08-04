import { pgEnum, pgTable, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core'

import { suppliers } from './suppliers.schema'
import { users } from './users.schema'

export const bulkImportJobStatusEnum = pgEnum('bulk_import_job_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'PARTIAL',
  'FAILED'
])

export const bulkImportJobs = pgTable('bulk_import_jobs', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

  supplierId: integer('supplier_id')
    .notNull()
    .references(() => suppliers.id, { onDelete: 'restrict' }),
  filename: text('filename').notNull(),
  totalRows: integer('total_rows').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),
  errorCount: integer('error_count').notNull().default(0),
  status: bulkImportJobStatusEnum('status').notNull().default('PENDING'),
  errors: jsonb('errors').$type<Array<{ row: number; sku?: string; field: string; message: string }>>(),

  createdById: integer('created_by_id').references(() => users.id),

  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
})
