export type RuleCondition = {
  field: 'fabricType' | 'color' | 'gsm' | 'composition' | 'tag' | 'supplyType'
  operator: 'equals' | 'notEquals' | 'contains' | 'in' | 'gt' | 'gte' | 'lt' | 'lte'
  value: string | number | string[]
}

export type ImagePromptType = 'fabricBest' | 'usageProduct' | 'thumbnail'

export type ImagePromptConfig = {
  type: ImagePromptType
  label: string
  prompt: string
  count: number
}

export type PromptRule = {
  id: number
  name: string
  description: string | null
  priority: number
  isActive: boolean
  conditions: RuleCondition[]
  imagePrompts: ImagePromptConfig[]
  videoPrompt: string | null
  videoPromptEnabled: boolean
  videoDurationSeconds: number | null
  videoAspectRatio: string | null
  createdAt: string
  updatedAt: string
}

export type PromptRuleCreateInput = {
  name: string
  description?: string
  priority?: number
  isActive?: boolean
  conditions?: RuleCondition[]
  imagePrompts?: ImagePromptConfig[]
  videoPrompt?: string
  videoPromptEnabled?: boolean
  videoDurationSeconds?: number
  videoAspectRatio?: string
}

export type PromptRuleUpdateInput = Partial<PromptRuleCreateInput>

export type PromptRuleImportRow = {
  name: string
  description?: string
  priority?: number
  isActive?: boolean
  conditions?: RuleCondition[]
  imagePrompts?: ImagePromptConfig[]
  videoPrompt?: string
  videoPromptEnabled?: boolean
  videoDurationSeconds?: number
  videoAspectRatio?: string
}

export type PromptRuleTestResult = {
  matched: boolean
  matchedRule: PromptRule | null
  compiledImagePrompts: Array<{
    type: ImagePromptType
    label: string
    prompt: string
    count: number
  }>
  compiledVideoPrompt: string | null
  description: string
}

export type TextPromptRule = {
  id: number
  name: string
  description: string | null
  priority: number
  isActive: boolean
  conditions: RuleCondition[]
  enrichmentSystemPrompt: string | null
  enrichmentUserTemplate: string | null
  translationSystemPrompt: string | null
  translationUserTemplate: string | null
  socialSystemPrompt: string | null
  socialUserTemplate: string | null
  blogSystemPrompt: string | null
  blogUserTemplate: string | null
  createdAt: string
  updatedAt: string
}

export type TextPromptRuleCreateInput = {
  name: string
  description?: string
  priority?: number
  isActive?: boolean
  conditions?: RuleCondition[]
  enrichmentSystemPrompt?: string
  enrichmentUserTemplate?: string
  translationSystemPrompt?: string
  translationUserTemplate?: string
  socialSystemPrompt?: string
  socialUserTemplate?: string
  blogSystemPrompt?: string
  blogUserTemplate?: string
}

export type TextPromptRuleUpdateInput = Partial<TextPromptRuleCreateInput>