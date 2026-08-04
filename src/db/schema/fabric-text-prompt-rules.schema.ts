import { pgTable, text, integer, boolean, jsonb, timestamp, index } from 'drizzle-orm/pg-core'

import type { RuleCondition } from '@/types/prompt-rules'

export const fabricTextPromptRules = pgTable(
  'fabric_text_prompt_rules',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    priority: integer('priority').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    conditions: jsonb('conditions').$type<RuleCondition[]>().notNull().default([]),

    enrichmentSystemPrompt: text('enrichment_system_prompt'),
    enrichmentUserTemplate: text('enrichment_user_template'),

    translationSystemPrompt: text('translation_system_prompt'),
    translationUserTemplate: text('translation_user_template'),

    socialSystemPrompt: text('social_system_prompt'),
    socialUserTemplate: text('social_user_template'),

    blogSystemPrompt: text('blog_system_prompt'),
    blogUserTemplate: text('blog_user_template'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    textRulesActivePriorityIdx: index('fabric_text_rules_active_priority_idx').on(table.isActive, table.priority),
    textRulesNameIdx: index('fabric_text_rules_name_idx').on(table.name)
  })
)