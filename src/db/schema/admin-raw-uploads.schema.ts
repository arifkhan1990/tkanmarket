import { sql } from 'drizzle-orm'
import { pgEnum, pgTable, text, integer, timestamp, index, jsonb } from 'drizzle-orm/pg-core'

import { users } from './users.schema'

export const adminRawUploadStatusEnum = pgEnum('admin_raw_upload_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
])

export const adminRawUploads = pgTable(
  'admin_raw_uploads',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    filename: text('filename').notNull(),
    originalFileUrl: text('original_file_url'),
    fileType: text('file_type').notNull(),

    status: adminRawUploadStatusEnum('status').notNull().default('PENDING'),
    totalRows: integer('total_rows').notNull().default(0),
    processedRows: integer('processed_rows').notNull().default(0),
    errorRows: integer('error_rows').notNull().default(0),

    uploadedByUserId: integer('uploaded_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    adminRawUploadsStatusIdx: index('admin_raw_uploads_status_idx').on(table.status),
    adminRawUploadsUserIdx: index('admin_raw_uploads_user_idx').on(table.uploadedByUserId)
  })
)
