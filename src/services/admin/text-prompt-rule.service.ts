import { and, asc, eq, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabricTextPromptRules } from '@/db/schema/fabric-text-prompt-rules.schema'
import { logger } from '@/lib/logger'

import type {
  RuleCondition,
  TextPromptRule,
  TextPromptRuleCreateInput,
  TextPromptRuleUpdateInput
} from '@/types/prompt-rules'

type FabricTextPromptRule = typeof fabricTextPromptRules.$inferSelect

function rowToRule(row: FabricTextPromptRule): TextPromptRule {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priority: row.priority,
    isActive: row.isActive,
    conditions: row.conditions as RuleCondition[],
    enrichmentSystemPrompt: row.enrichmentSystemPrompt,
    enrichmentUserTemplate: row.enrichmentUserTemplate,
    translationSystemPrompt: row.translationSystemPrompt,
    translationUserTemplate: row.translationUserTemplate,
    socialSystemPrompt: row.socialSystemPrompt,
    socialUserTemplate: row.socialUserTemplate,
    blogSystemPrompt: row.blogSystemPrompt,
    blogUserTemplate: row.blogUserTemplate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

function evaluateConditions(conditions: RuleCondition[], fabric: Record<string, unknown>): boolean {
  if (conditions.length === 0) return true
  return conditions.every((c) => {
    const fieldVal = fabric[c.field]
    if (fieldVal === null || fieldVal === undefined) return false

    switch (c.operator) {
      case 'equals':
        return String(fieldVal).toLowerCase() === String(c.value).toLowerCase()
      case 'notEquals':
        return String(fieldVal).toLowerCase() !== String(c.value).toLowerCase()
      case 'contains':
        return String(fieldVal).toLowerCase().includes(String(c.value).toLowerCase())
      case 'in':
        return (c.value as string[]).some((v) => String(fieldVal).toLowerCase() === v.toLowerCase())
      case 'gt':
        return Number(fieldVal) > Number(c.value)
      case 'gte':
        return Number(fieldVal) >= Number(c.value)
      case 'lt':
        return Number(fieldVal) < Number(c.value)
      case 'lte':
        return Number(fieldVal) <= Number(c.value)
      default:
        return false
    }
  })
}

export class TextPromptRuleService {
  static substituteVariables(template: string, vars: Record<string, string>): string {
    let result = template
    for (const [key, value] of Object.entries(vars)) {
      result = result.replaceAll('{' + key + '}', value || '')
    }
    return result
  }

  static buildFabricVariables(fabric: {
    titleEn?: string | null
    titleRu?: string | null
    fabricType?: string | null
    color?: string | null
    composition?: string | null
    tags?: string | null
    supplyType?: string | null
    descriptionEn?: string | null
    descriptionRu?: string | null
    gsm?: number | null
    widthCm?: number | null
    moq?: number | null
    priceUsd?: string | null
    sourceUrl?: string | null
    images?: string | null
    rawTitle?: string | null
    rawDescription?: string | null
  }): Record<string, string> {
    return {
      title_en: fabric.titleEn ?? '',
      title_ru: fabric.titleRu ?? '',
      fabric_type: fabric.fabricType ?? '',
      color: fabric.color ?? '',
      composition: fabric.composition ?? '',
      tags: fabric.tags ?? '',
      supply_type: fabric.supplyType ?? '',
      description_en: fabric.descriptionEn ?? '',
      description_ru: fabric.descriptionRu ?? '',
      gsm: fabric.gsm != null ? String(fabric.gsm) : '',
      width_cm: fabric.widthCm != null ? String(fabric.widthCm) : '',
      moq: fabric.moq != null ? String(fabric.moq) : '',
      price_usd: fabric.priceUsd ?? '',
      source_url: fabric.sourceUrl ?? '',
      images: fabric.images ?? '',
      raw_title: fabric.rawTitle ?? '',
      raw_description: fabric.rawDescription ?? ''
    }
  }

  static async findMatchingRule(fabric: Record<string, unknown>): Promise<TextPromptRule | null> {
    const db = getDb()

    const rows = await db
      .select()
      .from(fabricTextPromptRules)
      .where(and(eq(fabricTextPromptRules.isActive, true), isNull(fabricTextPromptRules.deletedAt)))
      .orderBy(asc(fabricTextPromptRules.priority))

    for (const row of rows) {
      const conditions = row.conditions as RuleCondition[]
      if (evaluateConditions(conditions, fabric)) {
        return rowToRule(row)
      }
    }

    return null
  }

  static async list(): Promise<TextPromptRule[]> {
    const db = getDb()
    const rows = await db
      .select()
      .from(fabricTextPromptRules)
      .where(isNull(fabricTextPromptRules.deletedAt))
      .orderBy(asc(fabricTextPromptRules.priority))
    return rows.map(rowToRule)
  }

  static async getById(id: number): Promise<TextPromptRule | null> {
    const db = getDb()
    const row = await db
      .select()
      .from(fabricTextPromptRules)
      .where(and(eq(fabricTextPromptRules.id, id), isNull(fabricTextPromptRules.deletedAt)))
      .limit(1)
      .then((r) => r[0])
    return row ? rowToRule(row) : null
  }

  static async create(input: TextPromptRuleCreateInput): Promise<TextPromptRule> {
    const db = getDb()
    const [row] = await db
      .insert(fabricTextPromptRules)
      .values({
        name: input.name,
        description: input.description ?? null,
        priority: input.priority ?? 0,
        isActive: input.isActive ?? true,
        conditions: (input.conditions ?? []) as never,
        enrichmentSystemPrompt: input.enrichmentSystemPrompt ?? null,
        enrichmentUserTemplate: input.enrichmentUserTemplate ?? null,
        translationSystemPrompt: input.translationSystemPrompt ?? null,
        translationUserTemplate: input.translationUserTemplate ?? null,
        socialSystemPrompt: input.socialSystemPrompt ?? null,
        socialUserTemplate: input.socialUserTemplate ?? null,
        blogSystemPrompt: input.blogSystemPrompt ?? null,
        blogUserTemplate: input.blogUserTemplate ?? null
      })
      .returning()
    if (!row) throw new Error('Failed to create text prompt rule')
    return rowToRule(row)
  }

  static async update(id: number, input: TextPromptRuleUpdateInput): Promise<TextPromptRule> {
    const db = getDb()
    const updateData: Record<string, unknown> = {}
    if (input.name !== undefined) updateData['name'] = input.name
    if (input.description !== undefined) updateData['description'] = input.description
    if (input.priority !== undefined) updateData['priority'] = input.priority
    if (input.isActive !== undefined) updateData['isActive'] = input.isActive
    if (input.conditions !== undefined) updateData['conditions'] = input.conditions
    if (input.enrichmentSystemPrompt !== undefined) updateData['enrichmentSystemPrompt'] = input.enrichmentSystemPrompt
    if (input.enrichmentUserTemplate !== undefined) updateData['enrichmentUserTemplate'] = input.enrichmentUserTemplate
    if (input.translationSystemPrompt !== undefined) updateData['translationSystemPrompt'] = input.translationSystemPrompt
    if (input.translationUserTemplate !== undefined) updateData['translationUserTemplate'] = input.translationUserTemplate
    if (input.socialSystemPrompt !== undefined) updateData['socialSystemPrompt'] = input.socialSystemPrompt
    if (input.socialUserTemplate !== undefined) updateData['socialUserTemplate'] = input.socialUserTemplate
    if (input.blogSystemPrompt !== undefined) updateData['blogSystemPrompt'] = input.blogSystemPrompt
    if (input.blogUserTemplate !== undefined) updateData['blogUserTemplate'] = input.blogUserTemplate
    updateData['updatedAt'] = sql`now()`

    const [row] = await db
      .update(fabricTextPromptRules)
      .set(updateData as never)
      .where(and(eq(fabricTextPromptRules.id, id), isNull(fabricTextPromptRules.deletedAt)))
      .returning()
    if (!row) throw new Error('Text prompt rule not found')
    return rowToRule(row)
  }

  static async delete(id: number): Promise<void> {
    const db = getDb()
    await db
      .update(fabricTextPromptRules)
      .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(fabricTextPromptRules.id, id))
  }
}
