import { GoogleGenAI } from '@google/genai'

import { GOOGLE_AI_MODELS, GOOGLE_AI_MODEL_PRICING } from '@/constants'
import { getDb } from '@/db'
import { aiPromptLogs } from '@/db/schema/ai-prompt-logs.schema'
import { AiGenerationError, classifyAiError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import type { ChatMessage } from '@/types/ai.types'

export type AiCallContext = {
  source: 'enrichment' | 'translation' | 'social' | 'blog' | 'image' | 'video'
  fabricId?: number
  actorId?: number
}

let genAiClient: GoogleGenAI | null = null

function getGenAiClient(): GoogleGenAI {
  if (genAiClient) return genAiClient

  const apiKey = (process.env.GOOGLE_API_KEY ?? '').trim().replace(/^["']+|["']+$/g, '')
  if (!apiKey) {
    throw new Error(
      'Gemini API key not configured.\n' +
      '  Set GOOGLE_API_KEY in your .env file.\n' +
      '  Get a key at https://aistudio.google.com/apikey'
    )
  }

  genAiClient = new GoogleGenAI({ apiKey })
  logger.info('Gemini GenAI client initialized')
  return genAiClient
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function backoffMs(attempt: number): number {
  const base = 1500
  const max = 12_000
  const expo = Math.min(max, base * 2 ** Math.max(0, attempt - 1))
  const jitter = Math.floor(Math.random() * 250)
  return expo + jitter
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    })
  ]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

function calculateCost(model: string, promptTokens: number, candidatesTokens: number): number {
  const pricing = GOOGLE_AI_MODEL_PRICING[model]
  if (!pricing) return 0
  return (promptTokens * pricing.inputPerToken) + (candidatesTokens * pricing.outputPerToken)
}

function logAiCall(data: {
  source: string
  fabricId?: number
  actorId?: number
  model: string
  prompt: string
  systemPrompt?: string
  responseText?: string
  imageCount?: number
  videoCount?: number
  promptTokenCount?: number
  candidatesTokenCount?: number
  totalTokenCount?: number
  costUsd?: number
  status: 'success' | 'failed'
  errorMessage?: string
  durationMs: number
}): void {
  try {
    const db = getDb()
    db.insert(aiPromptLogs)
      .values({
        source: data.source,
        fabricId: data.fabricId ?? null,
        actorId: data.actorId ?? null,
        model: data.model,
        prompt: data.prompt,
        systemPrompt: data.systemPrompt ?? null,
        responseText: data.responseText ?? null,
        imageCount: data.imageCount ?? null,
        videoCount: data.videoCount ?? null,
        promptTokenCount: data.promptTokenCount ?? null,
        candidatesTokenCount: data.candidatesTokenCount ?? null,
        totalTokenCount: data.totalTokenCount ?? null,
        costUsd: data.costUsd !== undefined ? String(data.costUsd) : null,
        status: data.status,
        errorMessage: data.errorMessage ?? null,
        durationMs: data.durationMs,
        updatedAt: new Date()
      })
      .then(() => {})
      .catch((err) => {
        logger.warn('Failed to write ai_prompt_log', { message: (err as Error)?.message })
      })
  } catch {
    // silently skip — logging should never break the main flow
  }
}

/* ── 1. TEXT GENERATION ─────────────────────────── */

type CallGeminiOptions = {
  model?: string
  maxRetries?: number
  responseFormat?: 'json_object' | 'text'
  context?: AiCallContext
  inlineImages?: string[]
}

export async function callGemini(messages: ChatMessage[], options?: CallGeminiOptions): Promise<string> {
  const model = options?.model ?? GOOGLE_AI_MODELS.TEXT
  const maxRetries = options?.maxRetries ?? 3
  const responseFormat = options?.responseFormat ?? 'text'
  const ctx = options?.context

  const startTime = Date.now()
  const fullPrompt = messages.map((m) => `[${m.role}]\n${m.content}`).join('\n\n')
  const systemMessage = messages.find((m) => m.role === 'system')
  const userMessages = messages.filter((m) => m.role !== 'system')

  const truncatedPrompt = fullPrompt.length > 500 ? `${fullPrompt.slice(0, 500)}...` : fullPrompt
  logger.info('Gemini call prompt', {
    model,
    source: ctx?.source,
    fabricId: ctx?.fabricId,
    messageCount: messages.length,
    promptPreview: truncatedPrompt,
    promptLength: fullPrompt.length,
    hasInlineImages: Boolean(options?.inlineImages && options.inlineImages.length > 0)
  })

  const ai = getGenAiClient()

  const contents = userMessages.map((m, idx) => {
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: m.content }]
    if (idx === userMessages.length - 1 && options?.inlineImages && options.inlineImages.length > 0) {
      for (const imgDataUrl of options.inlineImages.slice(0, 3)) {
        const match = imgDataUrl.match(/^data:([^;]+);base64,(.+)$/)
        if (match && match[1] && match[2]) {
          let mime = match[1].trim()
          if (!mime || mime.includes('octet-stream')) mime = 'image/jpeg'
          parts.unshift({
            inlineData: {
              mimeType: mime,
              data: match[2]
            }
          })
        }
      }
    }
    return {
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts
    }
  })

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await withTimeout(
        ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: systemMessage?.content ?? undefined,
            responseMimeType: responseFormat === 'json_object' ? 'application/json' : 'text/plain'
          }
        }),
        60_000,
        'Gemini text generation'
      )

      const text = result.text ?? ''
      if (!text) throw new Error('Gemini returned empty content')

      const durationMs = Date.now() - startTime

      const promptTokens = result.usageMetadata?.promptTokenCount ?? 0
      const candidatesTokens = result.usageMetadata?.candidatesTokenCount ?? 0
      const totalTokens = result.usageMetadata?.totalTokenCount ?? 0
      const costUsd = calculateCost(model, promptTokens, candidatesTokens)

      logger.info('Gemini call succeeded', {
        source: ctx?.source,
        fabricId: ctx?.fabricId,
        model,
        attempt,
        responseLength: text.length,
        durationMs,
        promptTokens,
        candidatesTokens,
        costUsd: costUsd.toFixed(6),
        promptPreview: truncatedPrompt
      })

      if (ctx) {
        logAiCall({
          source: ctx.source,
          fabricId: ctx.fabricId,
          actorId: ctx.actorId,
          model,
          prompt: fullPrompt,
          systemPrompt: systemMessage?.content,
          responseText: text,
          promptTokenCount: promptTokens,
          candidatesTokenCount: candidatesTokens,
          totalTokenCount: totalTokens,
          costUsd,
          status: 'success',
          durationMs
        })
      }

      return text
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Google AI error'
      const classified = classifyAiError(err)
      logger.warn('Gemini call failed', { attempt, maxRetries, message, retryable: classified.retryable, source: ctx?.source, fabricId: ctx?.fabricId })
      if (!classified.retryable || attempt >= maxRetries) {
        const durationMs = Date.now() - startTime
        logger.error('Gemini call failed', {
          source: ctx?.source,
          fabricId: ctx?.fabricId,
          model,
          maxRetries,
          finalError: message,
          retryable: classified.retryable,
          durationMs,
          promptPreview: truncatedPrompt
        })

        if (ctx) {
          logAiCall({
            source: ctx.source,
            fabricId: ctx.fabricId,
            actorId: ctx.actorId,
            model,
            prompt: fullPrompt,
            systemPrompt: systemMessage?.content,
            status: 'failed',
            errorMessage: message,
            durationMs
          })
        }

        throw new AiGenerationError(classified.message, classified.code, classified.statusCode, classified.retryable)
      }
      await sleep(backoffMs(attempt))
    }
  }

  throw new Error('Gemini call failed')
}

/* ── 2. IMAGE GENERATION (gemini-3.1-flash-image) ── */

export async function generateGeminiImage(
  prompt: string,
  options?: {
    model?: string
    aspectRatio?: string
    numberOfImages?: number
    inputImages?: Array<{ inlineData: { mimeType: string; data: string } } | string>
    context?: AiCallContext
  }
): Promise<string[]> {
  const model = options?.model ?? GOOGLE_AI_MODELS.IMAGE
  const numberOfImages = options?.numberOfImages ?? 1
  const hasInputImages = !!(options?.inputImages && options.inputImages.length > 0)
  const ctx = options?.context

  const startTime = Date.now()
  const truncatedPrompt = prompt.length > 300 ? `${prompt.slice(0, 300)}...` : prompt
  logger.info('Gemini image generation prompt', {
    model,
    numberOfImages,
    hasInputImages,
    source: ctx?.source,
    fabricId: ctx?.fabricId,
    promptPreview: truncatedPrompt,
    promptLength: prompt.length
  })

  const ai = getGenAiClient()

  const userParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  if (options?.inputImages && options.inputImages.length > 0) {
    for (const img of options.inputImages) {
      if (typeof img === 'string') {
        let cleanImg = img.trim()
        // If data url has truncation or invalid header, guard it
        if (cleanImg.startsWith('data:')) {
          const commaIdx = cleanImg.indexOf(',')
          if (commaIdx !== -1) {
            const header = cleanImg.slice(0, commaIdx)
            const base64Data = cleanImg.slice(commaIdx + 1)
            let mimeType = header.split(';')[0]?.replace('data:', '')?.trim()
            if (!mimeType || !mimeType.startsWith('image/') || mimeType.includes('octet-stream')) {
              mimeType = 'image/jpeg'
            }
            if (mimeType && base64Data && base64Data.length > 100) {
              userParts.push({ inlineData: { mimeType, data: base64Data } })
            } else {
              logger.warn('Skipped input image due to insufficient base64 data length or truncation', { length: base64Data?.length })
            }
          }
        }
      } else if (img?.inlineData?.data && img.inlineData.data.length > 100) {
        let mimeType = img.inlineData.mimeType?.trim()
        if (!mimeType || !mimeType.startsWith('image/') || mimeType.includes('octet-stream')) {
          mimeType = 'image/jpeg'
        }
        userParts.push({ inlineData: { mimeType, data: img.inlineData.data } })
      }
    }
  }

  userParts.push({ text: prompt })

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await withTimeout(
        ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: userParts }],
          config: {
            responseModalities: ['image', 'text']
          }
        }),
        120_000,
        'Gemini image generation'
      )

      const responseParts = result.candidates?.[0]?.content?.parts ?? []
      const urls: string[] = []
      for (const p of responseParts) {
        const mimeType = p.inlineData?.mimeType
        const data = p.inlineData?.data
        if (mimeType?.startsWith('image/') && data) {
          // Verify data completeness (check if base64 padding or length looks truncated)
          if (data.length > 500) {
            urls.push(`data:${mimeType};base64,${data}`)
          } else {
            logger.warn('Discarded returned image part because it appears truncated', { length: data.length })
          }
        }
      }
      if (urls.length === 0) throw new Error('Gemini returned no valid non-truncated images')

      const resultDataUrls = urls.slice(0, numberOfImages)
      const durationMs = Date.now() - startTime

      const promptTokens = result.usageMetadata?.promptTokenCount ?? 0
      const candidatesTokens = result.usageMetadata?.candidatesTokenCount ?? 0
      const totalTokens = result.usageMetadata?.totalTokenCount ?? 0
      const costUsd = calculateCost(model, promptTokens, candidatesTokens)

      logger.info('Gemini image generation succeeded', {
        attempt,
        model,
        source: ctx?.source,
        fabricId: ctx?.fabricId,
        imageCount: resultDataUrls.length,
        totalParts: responseParts.length,
        durationMs,
        promptTokens,
        candidatesTokens,
        costUsd: costUsd.toFixed(6),
        promptPreview: truncatedPrompt
      })

      if (ctx) {
        logAiCall({
          source: ctx.source,
          fabricId: ctx.fabricId,
          actorId: ctx.actorId,
          model,
          prompt,
          imageCount: resultDataUrls.length,
          promptTokenCount: promptTokens,
          candidatesTokenCount: candidatesTokens,
          totalTokenCount: totalTokens,
          costUsd,
          status: 'success',
          durationMs
        })
      }

      return resultDataUrls
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown image generation error'
      const classified = classifyAiError(err)
      logger.warn('Gemini image generation failed', {
        attempt,
        message,
        retryable: classified.retryable,
        model,
        source: ctx?.source,
        fabricId: ctx?.fabricId,
        promptPreview: truncatedPrompt,
        promptLength: prompt.length,
        hasInputImages
      })
      if (!classified.retryable || attempt >= 2) {
        const durationMs = Date.now() - startTime
        logger.error('Gemini image generation failed', {
          model,
          source: ctx?.source,
          fabricId: ctx?.fabricId,
          promptPreview: truncatedPrompt,
          promptLength: prompt.length,
          hasInputImages,
          retryable: classified.retryable,
          finalError: message,
          durationMs
        })

        if (ctx) {
          logAiCall({
            source: ctx.source,
            fabricId: ctx.fabricId,
            model,
            prompt,
            status: 'failed',
            errorMessage: message,
            durationMs
          })
        }

        throw new AiGenerationError(classified.message, classified.code, classified.statusCode, classified.retryable)
      }
      await sleep(backoffMs(attempt))
    }
  }

  throw new Error('Gemini image generation failed')
}

/* ── 3. VIDEO GENERATION ────────────────────────── */

export async function generateOmniFlashVideo(
  prompt: string,
  options?: {
    model?: string
    durationSeconds?: number
    aspectRatio?: string
    inputImages?: string[]
    context?: AiCallContext
  }
): Promise<Buffer[]> {
  const model = options?.model ?? GOOGLE_AI_MODELS.VIDEO
  const ctx = options?.context

  const startTime = Date.now()
  const truncatedPrompt = prompt.length > 300 ? `${prompt.slice(0, 300)}...` : prompt
  const hasInputImages = Boolean(options?.inputImages && options.inputImages.length > 0)
  logger.info('Omni Flash video generation prompt', {
    model,
    source: ctx?.source,
    fabricId: ctx?.fabricId,
    durationSeconds: options?.durationSeconds,
    aspectRatio: options?.aspectRatio,
    hasInputImages,
    promptPreview: truncatedPrompt,
    promptLength: prompt.length
  })

  const ai = getGenAiClient()

  // Build step_list content parts (Content_2 union: TextContent | ImageContent)
  const stepContentParts: Array<{ type: 'text'; text: string } | { type: 'image'; mime_type: string; data: string }> = []
  if (options?.inputImages && options.inputImages.length > 0) {
    for (const img of options.inputImages.slice(0, 3)) {
      if (typeof img === 'string' && img.startsWith('data:')) {
        const match = img.match(/^data:([^;]+);base64,(.+)$/)
        if (match && match[1] && match[2]) {
          let mime = match[1].trim()
          if (!mime || mime.includes('octet-stream')) mime = 'image/jpeg'
          stepContentParts.push({ type: 'image', mime_type: mime, data: match[2] })
        }
      }
    }
  }
  stepContentParts.push({ type: 'text', text: prompt })

  // Use step_list format (Array<UserInputStep>) — required by the Interactions API.
  // turn_list format ([{role, content}]) causes a 400 error.
  const inputPayload: Array<{ type: 'user_input'; content: typeof stepContentParts }> = [
    { type: 'user_input', content: stepContentParts }
  ]

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await withTimeout(
        ai.interactions.create({
          model,
          input: inputPayload as any
        }),
        120_000,
        'Omni Flash video generation'
      )

      const videos: Buffer[] = []

      // 1) Direct output_video
      const outputVideoData = (result as Record<string, unknown>).output_video as { data?: string } | undefined
      if (outputVideoData?.data) {
        videos.push(Buffer.from(outputVideoData.data, 'base64'))
      } else {
        // 2) Fallback to steps -> content -> video
        const steps = (result as Record<string, unknown>).steps as Array<{ content?: Array<{ type?: string; data?: string }> }> | undefined
        for (const step of steps ?? []) {
          for (const item of step.content ?? []) {
            if (item.type === 'video' && item.data) {
              videos.push(Buffer.from(item.data, 'base64'))
            }
          }
        }
      }

      if (videos.length === 0) throw new Error('Omni Flash returned no video data')

      const durationMs = Date.now() - startTime

      const usage = (result as Record<string, unknown>).usage as { total_input_tokens?: number; total_tokens?: number } | undefined
      const promptTokens = usage?.total_input_tokens ?? 0
      const totalTokens = usage?.total_tokens ?? 0
      const candidatesTokens = totalTokens > promptTokens ? totalTokens - promptTokens : 0
      const costUsd = calculateCost(model, promptTokens, candidatesTokens)

      logger.info('Omni Flash video generation succeeded', {
        attempt,
        model,
        source: ctx?.source,
        fabricId: ctx?.fabricId,
        videoCount: videos.length,
        durationMs,
        promptTokens,
        candidatesTokens,
        costUsd: costUsd.toFixed(6),
        promptPreview: truncatedPrompt
      })

      if (ctx) {
        logAiCall({
          source: ctx.source,
          fabricId: ctx.fabricId,
          actorId: ctx.actorId,
          model,
          prompt,
          videoCount: videos.length,
          promptTokenCount: promptTokens,
          candidatesTokenCount: candidatesTokens,
          totalTokenCount: totalTokens,
          costUsd,
          status: 'success',
          durationMs
        })
      }

      return videos
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown video generation error'
      const classified = classifyAiError(err)
      logger.warn('Omni Flash video generation failed', {
        attempt,
        message,
        retryable: classified.retryable,
        model,
        source: ctx?.source,
        fabricId: ctx?.fabricId,
        promptPreview: truncatedPrompt
      })
      if (!classified.retryable || attempt >= 2) {
        const durationMs = Date.now() - startTime
        logger.error('Omni Flash video generation failed', {
          model,
          source: ctx?.source,
          fabricId: ctx?.fabricId,
          promptPreview: truncatedPrompt,
          promptLength: prompt.length,
          retryable: classified.retryable,
          finalError: message,
          durationMs
        })

        if (ctx) {
          logAiCall({
            source: ctx.source,
            fabricId: ctx.fabricId,
            model,
            prompt,
            status: 'failed',
            errorMessage: message,
            durationMs
          })
        }

        throw new AiGenerationError(classified.message, classified.code, classified.statusCode, classified.retryable)
      }
      await sleep(backoffMs(attempt))
    }
  }

  throw new Error('Omni Flash video generation failed')
}
