import { pgEnum, pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core'

export const catalogExportFormatEnum = pgEnum('catalog_export_format', ['CSV', 'XLSX', 'JSON'])

export const catalogExportStatusEnum = pgEnum('catalog_export_status', [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED'
])

export const catalogExportJobs = pgTable(
  'catalog_export_jobs',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    jobName: text('job_name').notNull(),
    format: catalogExportFormatEnum('format').notNull().default('CSV'),

    status: catalogExportStatusEnum('status').notNull().default('PENDING'),

    recordCount: integer('record_count').notNull().default(0),
    estimatedSizeBytes: integer('estimated_size_bytes').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    catalogExportJobsStatusIdx: index('catalog_export_jobs_status_idx').on(table.status),
    catalogExportJobsCreatedAtDescIdx: index('catalog_export_jobs_created_at_desc_idx').on(
      table.createdAt
    )
  })
)

