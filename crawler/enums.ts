// ============================================================
// TkanMarket – All Application Enums
// Import from here everywhere – never hardcode string values
// ============================================================

export enum FabricStatus {
  RAW_SCRAPED    = 'raw_scraped',
  AI_PROCESSING  = 'ai_processing',
  AI_PROCESSED   = 'ai_processed',
  APPROVED       = 'approved',
  REJECTED       = 'rejected',
}

export enum FabricType {
  WOVEN     = 'woven',
  KNIT      = 'knit',
  NONWOVEN  = 'nonwoven',
  LACE      = 'lace',
  LINING    = 'lining',
  TECHNICAL = 'technical',
  OTHER     = 'other',
}

export enum LeadStatus {
  NEW            = 'NEW',
  CONTACTED      = 'CONTACTED',
  QUALIFIED      = 'QUALIFIED',
  PROPOSAL_SENT  = 'PROPOSAL_SENT',
  NEGOTIATING    = 'NEGOTIATING',
  CLOSED_WON     = 'CLOSED_WON',
  CLOSED_LOST    = 'CLOSED_LOST',
}

export enum LeadSource {
  MARKETPLACE_INQUIRY = 'MARKETPLACE_INQUIRY',
  SAMPLE_REQUEST      = 'SAMPLE_REQUEST',
  SOCIAL_CAMPAIGN     = 'SOCIAL_CAMPAIGN',
  DIRECT_CONTACT      = 'DIRECT_CONTACT',
  MANUAL_ENTRY        = 'MANUAL_ENTRY',
}

export enum UserRole {
  ADMIN  = 'ADMIN',
  SALES  = 'SALES',
  VIEWER = 'VIEWER',
}

export enum SocialPlatform {
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK    = 'TIKTOK',
  PINTEREST = 'PINTEREST',
  FACEBOOK  = 'FACEBOOK',
  YOUTUBE   = 'YOUTUBE',
}

export enum SocialPostStatus {
  DRAFT     = 'DRAFT',
  APPROVED  = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  FAILED    = 'FAILED',
}

export enum SocialContentType {
  REEL_15   = 'REEL_15',
  REEL_20   = 'REEL_20',
  REEL_30   = 'REEL_30',
  CAROUSEL  = 'CAROUSEL',
  IMAGE_POST= 'IMAGE_POST',
  PIN       = 'PIN',
}

export enum CrawlerJobStatus {
  PENDING   = 'PENDING',
  RUNNING   = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED    = 'FAILED',
  PARTIAL   = 'PARTIAL',
}

export enum QueueName {
  CRAWLER = 'crawler_jobs',
  AI      = 'ai_processing_jobs',
  IMAGE   = 'image_processing_jobs',
  SOCIAL  = 'social_media_jobs',
}
