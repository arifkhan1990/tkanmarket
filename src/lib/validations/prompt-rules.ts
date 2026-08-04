import { z } from 'zod'

const ruleConditionFieldEnum = z.enum(['fabricType', 'color', 'gsm', 'composition', 'tag', 'supplyType'])
const ruleConditionOperatorEnum = z.enum(['equals', 'notEquals', 'contains', 'in', 'gt', 'gte', 'lt', 'lte'])

const RuleConditionSchema = z.object({
  field: ruleConditionFieldEnum,
  operator: ruleConditionOperatorEnum,
  value: z.union([z.string(), z.number(), z.array(z.string())])
})

const ImagePromptTypeEnum = z.enum(['fabricBest', 'usageProduct', 'thumbnail'])

const ImagePromptConfigSchema = z.object({
  type: ImagePromptTypeEnum,
  label: z.string().min(1, 'Label is required'),
  prompt: z.string().min(1, 'Prompt template is required'),
  count: z.number().int().min(1).max(10)
})

export const CreatePromptRuleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional().default(''),
  priority: z.number().int().min(0).max(9999).optional().default(0),
  isActive: z.boolean().optional().default(true),
  conditions: z.array(RuleConditionSchema).optional().default([]),
  imagePrompts: z.array(ImagePromptConfigSchema).optional().default([
    {
      type: 'fabricBest',
      label: 'Best Fabric Shot',
      prompt: 'Professional product photo of fabric {title} on white background. Show texture and drape clearly. Studio lighting, high resolution, e-commerce style.',
      count: 2
    },
    {
      type: 'usageProduct',
      label: 'Fabric in Use',
      prompt: 'Lifestyle photo showing fabric {title} being used as fabric material in a real setting. A professional tailor working with the material. Soft natural lighting, warm atmosphere, realistic.',
      count: 2
    },
    {
      type: 'thumbnail',
      label: 'Thumbnail',
      prompt: 'Close-up macro shot of fabric {title} texture and weave pattern. High contrast, sharp details, square format, product thumbnail style on white background.',
      count: 1
    }
  ]),
  videoPrompt: z.string().max(5000).optional().default(''),
  videoPromptEnabled: z.boolean().optional().default(true),
  videoDurationSeconds: z.union([z.literal(5), z.literal(8), z.literal(10)]).optional().default(8),
  videoAspectRatio: z.string().optional().default('9:16')
})

export const UpdatePromptRuleSchema = CreatePromptRuleSchema.partial()

export const ImportPromptRulesSchema = z.object({
  rules: z.array(CreatePromptRuleSchema).min(1, 'At least one rule is required').max(500)
})

export const TestRuleSchema = z.object({
  ruleId: z.number().int().positive().optional(),
  fabricData: z.object({
    title: z.string().optional().default(''),
    titleEn: z.string().optional().default(''),
    titleRu: z.string().optional().default(''),
    fabricType: z.string().optional().default(''),
    color: z.string().optional().default(''),
    gsm: z.number().optional().nullable(),
    composition: z.string().optional().default(''),
    tags: z.string().optional().default(''),
    supplyType: z.string().optional().default(''),
    description: z.string().optional().default(''),
    descriptionEn: z.string().optional().default(''),
    descriptionRu: z.string().optional().default('')
  })
})
