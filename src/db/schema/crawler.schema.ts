import { pgEnum, pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core'

import { users } from './users.schema'

export const crawlerJobStatusEnum = pgEnum('crawler_job_status', [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'PARTIAL'
])

export const crawlerRuns = pgTable(
  'crawler_runs',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    status: crawlerJobStatusEnum('status').notNull().default('PENDING'),
    source: text('source').notNull(),
    keywords: text('keywords').array().notNull(),

    productsFound: integer('products_found').notNull().default(0),
    productsSaved: integer('products_saved').notNull().default(0),
    errorsCount: integer('errors_count').notNull().default(0),

    triggeredById: integer('triggered_by_id').references(() => users.id),

    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    errorLog: text('error_log'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    crawlerRunsTriggeredByIdIdx: index('crawler_runs_triggered_by_id_idx').on(table.triggeredById)
  })
)

