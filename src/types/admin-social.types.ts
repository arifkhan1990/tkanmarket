export interface SocialPlatformMetadata {
  postTitle?: string | null
  callToAction?: string | null
  specificationsSummary?: string | null
  keyFeatures?: string[]
  targetAudience?: string | null
  imagePrompt?: string | null
  imageOverlayText?: string | null
  carouselSlides?: Array<{ slideNumber: number; title: string; imageDescription: string }>
  recommendedPostingTime?: string | null
  [key: string]: unknown
}

export interface AdminSocialQueueItem {
  id: number
  platform: string
  contentType: string
  status: string
  reviewState?: string | null
  revisionNumber?: number | null
  rejectionReason?: string | null
  supersedesPostId?: number | null
  captionText: string | null
  scheduledAt: string | null
  publishedAt: string | null
  createdAt: string
  approvedAt?: string | null
  publishAttempts?: number | null
  lastPublishErrorAt?: string | null
  reach: number | null
  likes: number | null
  shares: number | null
  linkClicks: number | null
  errorMessage: string | null
  /** First resolved image: post media or fabric catalog image */
  primaryImageUrl: string | null
  fabricTitle: string | null
  fabricSku: string | null
  supplierName: string | null
  hashtags: string[] | null
  scriptText: string | null
  socialScore: number | null
  platformMetadata?: SocialPlatformMetadata | null
  /** Publish hardening — the account the post was published from and version. */
  publishCredentialId?: number | null
  platformAccountId?: string | null
  publishedVersion?: number | null
  timezone?: string | null
}

export interface AdminSocialQueueResult {
  items: AdminSocialQueueItem[]
  total: number
}

export interface AdminSocialStats {
  totalScheduled: number
  totalPublished: number
  activeCampaignFabrics: number
  nextPublication: {
    captionPreview: string | null
    scheduledAt: string | null
  } | null
}

export interface AdminSocialPostDetail extends AdminSocialQueueItem {
  fabricId: number
  mediaUrls: string[] | null
  fabricImages: string[] | null
  /** Latest COMPLETED AI-generated reel for the post's fabric, if any. */
  generatedVideoUrl?: string | null
}

export interface AdminSocialCreatePostInput {
  fabric_id: number
  platform: 'INSTAGRAM' | 'TIKTOK' | 'PINTEREST' | 'FACEBOOK' | 'YOUTUBE'
  content_type?: 'REEL_5' | 'REEL_8' | 'REEL_10' | 'CAROUSEL' | 'IMAGE_POST' | 'PIN'
}

export interface AdminSocialAiBatchInput {
  platform: 'INSTAGRAM' | 'TIKTOK' | 'PINTEREST' | 'FACEBOOK' | 'YOUTUBE'
  post_ids: number[]
  content_type?: 'REEL_5' | 'REEL_8' | 'REEL_10' | 'CAROUSEL' | 'IMAGE_POST' | 'PIN'
}
