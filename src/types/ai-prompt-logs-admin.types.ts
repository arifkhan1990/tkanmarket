export type AiPromptLogItem = {
  id: number
  source: string
  fabric_id: number | null
  fabric_title: string | null
  actor_id: number | null
  actor_name: string | null
  actor_email: string | null
  model: string
  prompt: string
  system_prompt: string | null
  response_text: string | null
  image_count: number | null
  video_count: number | null
  prompt_token_count: number | null
  candidates_token_count: number | null
  total_token_count: number | null
  cost_usd: string | null
  status: string
  error_message: string | null
  duration_ms: number | null
  created_at: string
}

export type AiPromptLogsListResponse = {
  items: AiPromptLogItem[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type AiPromptLogsStats = {
  total_prompts: number
  total_tokens: number
  total_input_tokens: number
  total_output_tokens: number
  total_cost_usd: number
  avg_duration_ms: number
  success_rate_pct: number
}
