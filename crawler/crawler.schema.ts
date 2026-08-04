import {
  pgTable, integer, text, timestamptz, pgEnum, index,
} from 'drizzle-orm/pg-core'
import { users } from './users.schema'

export const crawlerJobStatusEnum = pgEnum('crawler_job_status', [
  'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL',
])

export const crawlerRuns = pgTable('crawler_runs', {
  id:              integer('id').generatedAlwaysAsIdentity().primaryKey(),
  status:          crawlerJobStatusEnum('status').notNull().default('PENDING'),
  source:          text('source').notNull(),
  keywords:        text('keywords').array().notNull(),
  productsFound:   integer('products_found').notNull().default(0),
  productsSaved:   integer('products_saved').notNull().default(0),
  errorsCount:     integer('errors_count').notNull().default(0),
  triggeredById:   integer('triggered_by_id').references(() => users.id, { onDelete: 'set null' }),
  startedAt:       timestamptz('started_at'),
  completedAt:     timestamptz('completed_at'),
  errorLog:        text('error_log'),
  createdAt:       timestamptz('created_at').notNull().defaultNow(),
}, (table) => ({
  statusIdx:    index('crawler_runs_status_idx').on(table.status),
  createdAtIdx: index('crawler_runs_created_at_idx').on(table.createdAt),
}))

export type CrawlerRun    = typeof crawlerRuns.$inferSelect
export type NewCrawlerRun = typeof crawlerRuns.$inferInsert
