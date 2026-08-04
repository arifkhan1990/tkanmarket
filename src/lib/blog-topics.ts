/** URL `topic` param values and canonical `blog_posts.category` strings used for filtering. */
export const BLOG_TOPIC_PARAM = {
  all: 'all',
  sourcing: 'sourcing',
  logistics: 'logistics',
  sustainability: 'sustainability',
  technical: 'technical',
  trends: 'trends'
} as const

export type BlogTopicParam = (typeof BLOG_TOPIC_PARAM)[keyof typeof BLOG_TOPIC_PARAM]

const TOPIC_KEY_TO_CATEGORY: Record<string, string> = {
  [BLOG_TOPIC_PARAM.sourcing]: 'Sourcing',
  [BLOG_TOPIC_PARAM.logistics]: 'Logistics',
  [BLOG_TOPIC_PARAM.sustainability]: 'Sustainability',
  [BLOG_TOPIC_PARAM.technical]: 'Technical Specs',
  [BLOG_TOPIC_PARAM.trends]: 'Market Trends'
}

export function parseBlogTopicParam(raw: string | undefined): BlogTopicParam {
  if (!raw) return BLOG_TOPIC_PARAM.all
  const v = raw.trim().toLowerCase()
  if (v === BLOG_TOPIC_PARAM.all || v === '') return BLOG_TOPIC_PARAM.all
  if ((Object.values(BLOG_TOPIC_PARAM) as string[]).includes(v)) return v as BlogTopicParam
  return BLOG_TOPIC_PARAM.all
}

/** Returns `null` when “all topics” — otherwise the exact category label stored in DB. */
export function categoryLabelForTopic(topic: BlogTopicParam): string | null {
  if (topic === BLOG_TOPIC_PARAM.all) return null
  return TOPIC_KEY_TO_CATEGORY[topic] ?? null
}

/**
 * Matches `design/blog.html` category labels: “Sustainable Labs” rolls up under the Sustainability topic.
 */
export function postMatchesTopicFilter(category: string | null, topic: BlogTopicParam): boolean {
  if (topic === BLOG_TOPIC_PARAM.all) return true
  const label = categoryLabelForTopic(topic)
  if (!label) return true
  const c = category ?? ''
  if (topic === BLOG_TOPIC_PARAM.sustainability) {
    return c === 'Sustainability' || c === 'Sustainable Labs'
  }
  return c === label
}
