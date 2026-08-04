import type { SocialPlatform } from '@/types/enums'

// ============================================================
// Base job payload – all jobs must include these fields
// ============================================================
export interface BaseJobPayload {
  jobId:      string    // UUID for tracking
  createdAt:  string    // ISO timestamp
  entityId:   number    // Integer FK to relevant record
  entityType: string    // 'fabric' | 'supplier' | 'post' | 'crawler_run'
  priority:   number    // 1–10 (10 = highest)
}

// ============================================================
// Crawler job
// ============================================================
export interface CrawlerJobPayload extends BaseJobPayload {
  entityType:  'crawler_run'
  crawlerRunId: number
  keywords:    string[]
  source:      'alibaba' | '1688' | 'both'
  maxProducts: number
}

// ============================================================
// AI processing job
// ============================================================
export interface AIJobPayload extends BaseJobPayload {
  entityType: 'fabric'
  fabricId:   number
}

// ============================================================
// Image processing job
// ============================================================
export interface ImageJobPayload extends BaseJobPayload {
  entityType: 'fabric'
  fabricId:   number
  imageUrls:  string[]
}

// ============================================================
// Social media job
// ============================================================
export interface SocialJobPayload extends BaseJobPayload {
  entityType: 'fabric'
  fabricId:   number
  platforms:  SocialPlatform[]
}

// ============================================================
// Queue stats (for admin dashboard)
// ============================================================
export interface QueueStats {
  name:      string
  waiting:   number
  active:    number
  completed: number
  failed:    number
  delayed:   number
}
