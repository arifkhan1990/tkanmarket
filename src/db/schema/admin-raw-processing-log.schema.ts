import { sql } from 'drizzle-orm'
import { pgEnum, pgTable, text, integer, timestamp, index, jsonb } from 'drizzle-orm/pg-core'

import { adminRawUploads } from './admin-raw-uploads.schema'
import { adminRawUploadRows } from './admin-raw-upload-rows.schema'
import { fabrics } from './fabrics.schema'

export const adminRawProcessingStatusEnum = pgEnum('admin_raw_processing_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'SKIPPED'
])

export const adminRawProcessingLog = pgTable(
  'admin_raw_processing_log',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    uploadId: integer('upload_id')
      .notNull()
      .references(() => adminRawUploads.id, { onDelete: 'restrict' }),
    rowId: integer('row_id')
      .notNull()
      .references(() => adminRawUploadRows.id, { onDelete: 'restrict' }),
    fabricId: integer('fabric_id').references(() => fabrics.id, { onDelete: 'set null' }),

    status: adminRawProcessingStatusEnum('status').notNull().default('PENDING'),

    aiConfidenceScore: text('ai_confidence_score'),
    aiProcessedAt: timestamp('ai_processed_at', { withTimezone: true }),
    aiStatus: text('ai_status'),

    errorMessage: text('error_message'),
    retriesCount: integer('retries_count').notNull().default(0),

    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    adminRawProcessingLogUploadIdx: index('admin_raw_processing_log_upload_idx').on(table.uploadId),
    adminRawProcessingLogStatusIdx: index('admin_raw_processing_log_status_idx').on(table.status),
    adminRawProcessingLogFabricIdx: index('admin_raw_processing_log_fabric_idx').on(table.fabricId)
  })
)
