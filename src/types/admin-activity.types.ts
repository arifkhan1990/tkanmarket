export type AdminActivityEventType =
  | 'LEAD_CREATED'
  | 'LEAD_STATUS_CHANGED'
  | 'LEAD_ASSIGNED'
  | 'NOTE_ADDED'
  | 'SYSTEM'
  | string

export interface AdminActivityEvent {
  /** Stable unique key across lead + fabric activity sources (e.g. `lead:12`, `fabric:3`). */
  id: string
  event_type: AdminActivityEventType
  message: string
  created_at: string
}

