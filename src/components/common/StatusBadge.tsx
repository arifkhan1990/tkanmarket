'use client'

import type { FabricStatus } from '@/types/status.types'
import type { LeadStatus } from '@/types/marketplace.types'
import { Badge } from '@/components/ui/badge'

type BadgeIntent = 'default' | 'success' | 'warning' | 'error' | 'brand'
type LeadBadgeStyles = BadgeIntent | { intent: BadgeIntent; className?: string }

function fabricStatusIntent(status: FabricStatus): BadgeIntent {
  if (status === 'raw_scraped') return 'default'
  if (status === 'ai_processing') return 'brand'
  if (status === 'ai_processed') return 'brand'
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  return 'default'
}

function leadStatusStyles(status: LeadStatus): LeadBadgeStyles {
  if (status === 'NEW') return 'warning'
  if (status === 'CONTACTED') return 'brand'
  if (status === 'QUALIFIED') return { intent: 'default', className: 'bg-purple-50 text-purple-700' }
  if (status === 'CLOSED_WON') return 'success'
  if (status === 'CLOSED_LOST') return 'error'
  return 'default'
}

export function StatusBadge(props: { type: 'fabric'; status: FabricStatus } | { type: 'lead'; status: LeadStatus }) {
  if (props.type === 'fabric') {
    const intent = fabricStatusIntent(props.status)
    return <Badge intent={intent}>{props.status}</Badge>
  }

  const styles = leadStatusStyles(props.status)
  if (typeof styles === 'string') return <Badge intent={styles}>{props.status}</Badge>
  return (
    <Badge intent={styles.intent} className={styles.className}>
      {props.status}
    </Badge>
  )
}

