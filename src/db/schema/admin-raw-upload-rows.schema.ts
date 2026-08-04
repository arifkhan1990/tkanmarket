import { sql } from 'drizzle-orm'
import { pgEnum, pgTable, text, integer, timestamp, index, jsonb } from 'drizzle-orm/pg-core'

import { adminRawUploads } from './admin-raw-uploads.schema'

export const adminRawUploadRowStatusEnum = pgEnum('admin_raw_upload_row_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
])

export const adminRawUploadRows = pgTable(
  'admin_raw_upload_rows',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    uploadId: integer('upload_id')
      .notNull()
      .references(() => adminRawUploads.id, { onDelete: 'restrict' }),
    rowIndex: integer('row_index').notNull(),
    rawData: jsonb('raw_data').notNull(),
    normalizedData: jsonb('normalized_data'),

    status: adminRawUploadRowStatusEnum('status').notNull().default('PENDING'),
    errorMessage: text('error_message'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    adminRawUploadRowsUploadIdx: index('admin_raw_upload_rows_upload_idx').on(table.uploadId),
    adminRawUploadRowsStatusIdx: index('admin_raw_upload_rows_status_idx').on(table.status)
  })
)
