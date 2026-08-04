import { and, asc, eq, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { fabricPromptRules } from '@/db/schema/fabric-prompt-rules.schema'
import { logger } from '@/lib/logger'

import type {
  PromptRule,
  PromptRuleCreateInput,
  PromptRuleUpdateInput,
  PromptRuleImportRow,
  PromptRuleTestResult,
  RuleCondition,
  ImagePromptConfig,
  ImagePromptType
} from '@/types/prompt-rules'

type FabricPromptRule = typeof fabricPromptRules.$inferSelect

function rowToRule(row: FabricPromptRule): PromptRule {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priority: row.priority,
    isActive: row.isActive,
    conditions: row.conditions as RuleCondition[],
    imagePrompts: row.imagePrompts as ImagePromptConfig[],
    videoPrompt: row.videoPrompt,
    videoPromptEnabled: row.videoPromptEnabled,
    videoDurationSeconds: row.videoDurationSeconds,
    videoAspectRatio: row.videoAspectRatio,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

export class PromptRuleService {
  /* ── Helpers ───────────────────────────────── */

  /* ── System Prompt Rules / Constraints ───────────────────────── */
  static readonly FABRIC_CONSISTENCY_INSTRUCTION =
    'CRITICAL MANDATORY REQUIREMENT: Maintain 100% exact consistency with the original raw fabric sample. The color shade, pattern, weave texture, surface finish, design details, material appearance, and contextual characteristics of the fabric MUST remain 100% identical to the reference fabric specifications without any modifications, color drift, or stylistic deviations.'

  static substituteVariables(template: string, vars: Record<string, string>): string {
    let result = template
    for (const [key, value] of Object.entries(vars)) {
      result = result.replaceAll(`{${key}}`, value || '')
    }
    return result
  }

  static buildFabricVariables(fabric: {
    titleEn?: string | null
    titleRu?: string | null
    fabricType?: string | null
    gsm?: number | null
    color?: string | null
    composition?: string | null
    tags?: string | null
    supplyType?: string | null
    descriptionEn?: string | null
    descriptionRu?: string | null
  }): Record<string, string> {
    return {
      title: fabric.titleEn ?? fabric.titleRu ?? 'Fabric',
      titleEn: fabric.titleEn ?? '',
      titleRu: fabric.titleRu ?? '',
      color: fabric.color ?? '',
      fabricType: fabric.fabricType ?? '',
      gsm: fabric.gsm?.toString() ?? '',
      composition: fabric.composition ?? '',
      tags: fabric.tags ?? '',
      description: fabric.descriptionEn ?? fabric.descriptionRu ?? '',
      descriptionEn: fabric.descriptionEn ?? '',
      descriptionRu: fabric.descriptionRu ?? '',
      supplyType: fabric.supplyType ?? ''
    }
  }

  /* ── Condition Evaluation ────────────────────── */

  private static evaluateCondition(condition: RuleCondition, fabricVars: Record<string, string>, fabricData: {
    gsm?: number | null
    tags?: string | null
    composition?: string | null
  }): boolean {
    const op = condition.operator

    if (condition.field === 'gsm') {
      const gsm = fabricData.gsm
      if (gsm == null) return false
      switch (op) {
        case 'gt': return gsm > Number(condition.value)
        case 'gte': return gsm >= Number(condition.value)
        case 'lt': return gsm < Number(condition.value)
        case 'lte': return gsm <= Number(condition.value)
        case 'equals': return gsm === Number(condition.value)
        case 'notEquals': return gsm !== Number(condition.value)
        default: return false
      }
    }

    const fieldValue = fabricVars[condition.field] ?? ''

    switch (op) {
      case 'equals':
        return fieldValue.toLowerCase() === String(condition.value).toLowerCase()
      case 'notEquals':
        return fieldValue.toLowerCase() !== String(condition.value).toLowerCase()
      case 'contains':
        return fieldValue.toLowerCase().includes(String(condition.value).toLowerCase())
      case 'in':
        if (!Array.isArray(condition.value)) return false
        return condition.value.some((v: string) =>
          fieldValue.toLowerCase().includes(v.toLowerCase())
        )
      default:
        return false
    }
  }

  static evaluateConditions(
    conditions: RuleCondition[],
    fabricVars: Record<string, string>,
    fabricData: {
      gsm?: number | null
      tags?: string | null
      composition?: string | null
    }
  ): boolean {
    if (conditions.length === 0) return true
    return conditions.every((c) => this.evaluateCondition(c, fabricVars, fabricData))
  }

  /* ── Rule Matching ──────────────────────────── */

  static async findMatchingRule(
    fabricId: number
  ): Promise<PromptRule | null> {
    const db = getDb()

    const rows = await db
      .select({
        titleEn: fabrics.titleEn,
        titleRu: fabrics.titleRu,
        fabricType: fabrics.fabricType,
        gsm: fabrics.gsm,
        color: fabrics.color,
        composition: fabrics.composition,
        tags: fabrics.tags,
        supplyType: fabrics.supplyType,
        descriptionEn: fabrics.descriptionEn,
        descriptionRu: fabrics.descriptionRu
      })
      .from(fabrics)
      .where(
        and(
          eq(fabrics.id, fabricId),
          isNull(fabrics.deletedAt)
        )
      )
      .limit(1)

    const fabric = rows[0]
    if (!fabric) return null

    const compositionStr = Array.isArray(fabric.composition)
      ? fabric.composition.map((c) => (c as { material?: string }).material ?? '').filter(Boolean).join(', ')
      : ''
    const tagsStr = Array.isArray(fabric.tags) ? fabric.tags.join(', ') : ''

    return this.findMatchingRuleByData({
      titleEn: fabric.titleEn,
      titleRu: fabric.titleRu,
      fabricType: fabric.fabricType,
      gsm: fabric.gsm,
      color: fabric.color,
      composition: compositionStr,
      tags: tagsStr,
      supplyType: fabric.supplyType,
      descriptionEn: fabric.descriptionEn,
      descriptionRu: fabric.descriptionRu
    })
  }

  static async findMatchingRuleByData(fabricData: {
    titleEn?: string | null
    titleRu?: string | null
    fabricType?: string | null
    gsm?: number | null
    color?: string | null
    composition?: string | null
    tags?: string | null
    supplyType?: string | null
    descriptionEn?: string | null
    descriptionRu?: string | null
  }): Promise<PromptRule | null> {
    const db = getDb()

    const rows = await db
      .select()
      .from(fabricPromptRules)
      .where(
        and(
          eq(fabricPromptRules.isActive, true),
          isNull(fabricPromptRules.deletedAt)
        )
      )
      .orderBy(asc(fabricPromptRules.priority))

    const vars = this.buildFabricVariables(fabricData)
    const extra = {
      gsm: fabricData.gsm,
      composition: fabricData.composition,
      tags: fabricData.tags
    }

    for (const row of rows) {
      const conditions = row.conditions as RuleCondition[]
      if (this.evaluateConditions(conditions, vars, extra)) {
        return rowToRule(row)
      }
    }

    return null
  }

  /* ── Prompt Compilation ─────────────────────── */

  static compilePrompts(
    rule: PromptRule,
    fabricVars: Record<string, string>
  ): {
    imagePrompts: Array<{ type: ImagePromptType; label: string; prompt: string; count: number }>
    videoPrompt: string | null
  } {
    return {
      imagePrompts: (rule.imagePrompts ?? []).map((ip: ImagePromptConfig) => {
        const rawPrompt = this.substituteVariables(ip.prompt, fabricVars)
        return {
          type: ip.type,
          label: ip.label,
          prompt: `${rawPrompt} [System Rule: ${this.FABRIC_CONSISTENCY_INSTRUCTION}]`,
          count: ip.count
        }
      }),
      videoPrompt: rule.videoPrompt
        ? `${this.substituteVariables(rule.videoPrompt, fabricVars)} [System Rule: ${this.FABRIC_CONSISTENCY_INSTRUCTION}]`
        : null
    }
  }

  static async testRule(ruleId: number | undefined, fabricData: {
    title?: string
    titleEn?: string
    titleRu?: string
    fabricType?: string
    color?: string
    gsm?: number | null
    composition?: string
    tags?: string
    supplyType?: string
    description?: string
    descriptionEn?: string
    descriptionRu?: string
  }): Promise<PromptRuleTestResult> {
    const vars: Record<string, string> = {
      title: fabricData.title || fabricData.titleEn || fabricData.titleRu || 'Fabric',
      titleEn: fabricData.titleEn ?? '',
      titleRu: fabricData.titleRu ?? '',
      color: fabricData.color ?? '',
      fabricType: fabricData.fabricType ?? '',
      gsm: fabricData.gsm?.toString() ?? '',
      composition: fabricData.composition ?? '',
      tags: fabricData.tags ?? '',
      description: fabricData.description || fabricData.descriptionEn || fabricData.descriptionRu || '',
      descriptionEn: fabricData.descriptionEn ?? '',
      descriptionRu: fabricData.descriptionRu ?? '',
      supplyType: fabricData.supplyType ?? ''
    }

    const matchedRule = ruleId
      ? await this.getById(ruleId)
      : await this.findMatchingRuleByData({
          titleEn: fabricData.titleEn || fabricData.title,
          titleRu: fabricData.titleRu,
          fabricType: fabricData.fabricType,
          gsm: fabricData.gsm,
          color: fabricData.color,
          composition: fabricData.composition,
          tags: fabricData.tags,
          supplyType: fabricData.supplyType,
          descriptionEn: fabricData.descriptionEn || fabricData.description,
          descriptionRu: fabricData.descriptionRu
        })

    if (!matchedRule) {
      return {
        matched: false,
        matchedRule: null,
        compiledImagePrompts: [],
        compiledVideoPrompt: null,
        description: 'No matching rule found for this fabric data'
      }
    }

    const compiled = this.compilePrompts(matchedRule, vars)
    return {
      matched: true,
      matchedRule,
      compiledImagePrompts: compiled.imagePrompts,
      compiledVideoPrompt: compiled.videoPrompt,
      description: `Matched rule: ${matchedRule.name} (priority ${matchedRule.priority})`
    }
  }

  /* ── CRUD ──────────────────────────────────── */

  static async list(options?: { isActive?: boolean }): Promise<PromptRule[]> {
    const db = getDb()
    const conditions = [isNull(fabricPromptRules.deletedAt)]
    if (options?.isActive !== undefined) {
      conditions.push(eq(fabricPromptRules.isActive, options.isActive))
    }
    const rows = await db
      .select()
      .from(fabricPromptRules)
      .where(and(...conditions))
      .orderBy(asc(fabricPromptRules.priority))
    return rows.map(rowToRule)
  }

  static async getById(id: number): Promise<PromptRule | null> {
    const db = getDb()
    const [row] = await db
      .select()
      .from(fabricPromptRules)
      .where(and(eq(fabricPromptRules.id, id), isNull(fabricPromptRules.deletedAt)))
      .limit(1)
    return row ? rowToRule(row) : null
  }

  static async create(input: PromptRuleCreateInput): Promise<PromptRule> {
    const db = getDb()
    const [row] = await db
      .insert(fabricPromptRules)
      .values({
        name: input.name,
        description: input.description || null,
        priority: input.priority ?? 0,
        isActive: input.isActive ?? true,
        conditions: (input.conditions ?? []) as never,
        imagePrompts: (input.imagePrompts ?? []) as never,
        videoPrompt: input.videoPrompt || null,
        videoPromptEnabled: input.videoPromptEnabled ?? true,
        videoDurationSeconds: input.videoDurationSeconds ?? 8,
        videoAspectRatio: input.videoAspectRatio ?? '9:16'
      })
      .returning()
    if (!row) throw new Error('Failed to create prompt rule')
    logger.info('Prompt rule created', { ruleId: row.id, name: row.name })
    return rowToRule(row)
  }

  static async update(id: number, input: PromptRuleUpdateInput): Promise<PromptRule> {
    const db = getDb()
    const values: Record<string, unknown> = {}
    if (input.name !== undefined) values.name = input.name
    if (input.description !== undefined) values.description = input.description || null
    if (input.priority !== undefined) values.priority = input.priority
    if (input.isActive !== undefined) values.isActive = input.isActive
    if (input.conditions !== undefined) values.conditions = input.conditions as never
    if (input.imagePrompts !== undefined) values.imagePrompts = input.imagePrompts as never
    if (input.videoPrompt !== undefined) values.videoPrompt = input.videoPrompt || null
    if (input.videoPromptEnabled !== undefined) values.videoPromptEnabled = input.videoPromptEnabled
    if (input.videoDurationSeconds !== undefined) values.videoDurationSeconds = input.videoDurationSeconds
    if (input.videoAspectRatio !== undefined) values.videoAspectRatio = input.videoAspectRatio
    values.updatedAt = sql`now()`

    const [row] = await db
      .update(fabricPromptRules)
      .set(values)
      .where(and(eq(fabricPromptRules.id, id), isNull(fabricPromptRules.deletedAt)))
      .returning()
    if (!row) throw new Error('Prompt rule not found')
    logger.info('Prompt rule updated', { ruleId: id })
    return rowToRule(row)
  }

  static async delete(id: number): Promise<void> {
    const db = getDb()
    await db
      .update(fabricPromptRules)
      .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
      .where(and(eq(fabricPromptRules.id, id), isNull(fabricPromptRules.deletedAt)))
    logger.info('Prompt rule soft-deleted', { ruleId: id })
  }

  /* ── Import / Export ────────────────────────── */

  static async importRules(rules: PromptRuleImportRow[]): Promise<{ imported: number }> {
    const db = getDb()
    let count = 0
    for (const rule of rules) {
      await db.insert(fabricPromptRules).values({
        name: rule.name,
        description: rule.description || null,
        priority: rule.priority ?? 0,
        isActive: rule.isActive ?? true,
        conditions: (rule.conditions ?? []) as never,
        imagePrompts: (rule.imagePrompts ?? []) as never,
        videoPrompt: rule.videoPrompt || null,
        videoPromptEnabled: rule.videoPromptEnabled ?? true,
        videoDurationSeconds: rule.videoDurationSeconds ?? 8,
        videoAspectRatio: rule.videoAspectRatio ?? '9:16'
      })
      count++
    }
    logger.info('Prompt rules imported', { count })
    return { imported: count }
  }

  static async exportRules(): Promise<PromptRuleImportRow[]> {
    const db = getDb()
    const rows = await db
      .select()
      .from(fabricPromptRules)
      .where(isNull(fabricPromptRules.deletedAt))
      .orderBy(asc(fabricPromptRules.priority))
    return rows.map((r) => ({
      name: r.name,
      description: r.description ?? undefined,
      priority: r.priority,
      isActive: r.isActive,
      conditions: r.conditions as RuleCondition[],
      imagePrompts: r.imagePrompts as ImagePromptConfig[],
      videoPrompt: r.videoPrompt ?? undefined,
      videoPromptEnabled: r.videoPromptEnabled,
      videoDurationSeconds: r.videoDurationSeconds ?? undefined,
      videoAspectRatio: r.videoAspectRatio ?? undefined
    }))
  }
}
