import OpenAI from 'openai'
import { logger } from '@/lib/logger'
import { ExternalServiceError } from '@/lib/errors'
import { delay } from '@/lib/utils'

// ============================================================
// OpenAI client singleton
// ============================================================
let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (openaiClient) return openaiClient

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is required')

  openaiClient = new OpenAI({ apiKey })
  return openaiClient
}

// ============================================================
// Safe OpenAI call with retry + logging
// ============================================================
export async function callOpenAI(
  messages:    OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    model?:       string
    maxTokens?:   number
    jsonMode?:    boolean
    temperature?: number
  },
): Promise<string> {
  const client = getOpenAIClient()
  const model  = options?.model      ?? process.env.OPENAI_MODEL ?? 'gpt-4o'
  const maxTok = options?.maxTokens  ?? parseInt(process.env.OPENAI_MAX_TOKENS ?? '2000', 10)

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        max_tokens:    maxTok,
        temperature:   options?.temperature ?? 0.3,
        messages,
        ...(options?.jsonMode && {
          response_format: { type: 'json_object' },
        }),
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('Empty response from OpenAI')

      logger.info('OpenAI call succeeded', {
        model,
        promptTokens:     response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
      })

      return content

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      logger.warn(`OpenAI attempt ${attempt} failed`, { error: lastError.message })

      if (attempt < 3) await delay(attempt * 2000)
    }
  }

  throw new ExternalServiceError('OpenAI', lastError?.message ?? 'Unknown error')
}
