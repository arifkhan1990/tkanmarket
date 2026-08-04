export interface LeadSuccessClientProps {
  /** Set once from HttpOnly cookie (POST /api/v1/leads); avoids putting the name in the URL. */
  initialContactFromCookie?: string | null
}
