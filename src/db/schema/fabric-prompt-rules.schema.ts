import { pgTable, text, integer, boolean, jsonb, timestamp, index } from 'drizzle-orm/pg-core'

import type { RuleCondition, ImagePromptConfig } from '@/types/prompt-rules'

export const fabricPromptRules = pgTable(
  'fabric_prompt_rules',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    priority: integer('priority').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    conditions: jsonb('conditions').$type<RuleCondition[]>().notNull().default([]),
    imagePrompts: jsonb('image_prompts').$type<ImagePromptConfig[]>().notNull().default([]),
    videoPrompt: text('video_prompt'),
    videoPromptEnabled: boolean('video_prompt_enabled').notNull().default(true),
    videoDurationSeconds: integer('video_duration_seconds').default(8),
    videoAspectRatio: text('video_aspect_ratio').default('9:16'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    fabricPromptRulesActivePriorityIdx: index('fabric_prompt_rules_active_priority_idx').on(table.isActive, table.priority),
    fabricPromptRulesNameIdx: index('fabric_prompt_rules_name_idx').on(table.name)
  })
)
