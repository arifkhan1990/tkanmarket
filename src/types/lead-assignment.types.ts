import { z } from 'zod'

export const LeadAssignmentTriggerSchema = z.enum(['WEB', 'MARKETPLACE', 'DIRECT'])

export const LeadAssignmentConditionSchema = z.object({
  field: z.string().trim().min(1).max(64),
  op: z.enum(['IS', 'IS_NOT', 'CONTAINS', 'GT', 'GTE', 'LT', 'LTE']),
  value: z.string().trim().max(2000)
})

export const LeadAssignmentTargetSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ROUND_ROBIN'),
    teamLabel: z.string().trim().min(1).max(120)
  }),
  z.object({
    type: z.literal('SPECIALIST'),
    userId: z.number().int().positive().nullable()
  })
])

export const LeadAssignmentRuleSchema = z.object({
  id: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(200),
  version: z.string().trim().min(1).max(32),
  trigger: LeadAssignmentTriggerSchema,
  conditions: z.array(LeadAssignmentConditionSchema).max(20),
  assignment: LeadAssignmentTargetSchema
})

export const LeadOpsConfigSchema = z.object({
  assignmentRules: z.array(LeadAssignmentRuleSchema).max(50),
  draftNote: z.string().max(2000).optional(),
  lastModifiedAt: z.string().optional(),
  lastModifiedBy: z.string().optional()
})

export type LeadAssignmentTrigger = z.infer<typeof LeadAssignmentTriggerSchema>
export type LeadAssignmentCondition = z.infer<typeof LeadAssignmentConditionSchema>
export type LeadAssignmentRule = z.infer<typeof LeadAssignmentRuleSchema>
export type LeadOpsConfig = z.infer<typeof LeadOpsConfigSchema>

export interface LeadAssignmentRulesResponse {
  config: LeadOpsConfig
  stats: {
    routeVelocityPercent: number
    activeRulesCount: number
    overlappingRules: number
    lastModifiedAt: string | null
  }
}
