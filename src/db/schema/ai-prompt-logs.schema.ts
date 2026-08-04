import { pgTable, text, integer, timestamp, numeric, index } from 'drizzle-orm/pg-core'

import { fabrics } from './fabrics.schema'
import { users } from './users.schema'

export const aiPromptLogs = pgTable(
  'ai_prompt_logs',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    source: text('source').notNull(),
    // 'enrichment' | 'translation' | 'social' | 'blog' | 'image' | 'video'

    fabricId: integer('fabric_id').references(() => fabrics.id, { onDelete: 'set null' }),
    actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),

    model: text('model').notNull(),
    prompt: text('prompt').notNull(),
    systemPrompt: text('system_prompt'),

    responseText: text('response_text'),
    imageCount: integer('image_count'),
    videoCount: integer('video_count'),

    promptTokenCount: integer('prompt_token_count'),
    candidatesTokenCount: integer('candidates_token_count'),
    totalTokenCount: integer('total_token_count'),
    costUsd: numeric('cost_usd', { precision: 10, scale: 6 }),

    status: text('status').notNull().default('success'),
    errorMessage: text('error_message'),

    durationMs: integer('duration_ms'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    aiPromptLogsFabricIdIdx: index('ai_prompt_logs_fabric_id_idx').on(table.fabricId),
    aiPromptLogsSourceIdx: index('ai_prompt_logs_source_idx').on(table.source),
    aiPromptLogsCreatedAtIdx: index('ai_prompt_logs_created_at_idx').on(table.createdAt),
    aiPromptLogsActorIdx: index('ai_prompt_logs_actor_idx').on(table.actorId)
  })
)
