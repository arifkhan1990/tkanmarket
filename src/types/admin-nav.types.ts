import type { ComponentType } from 'react'

export type AdminNavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  badgeKey?: 'fabricsPendingReview'
}

export type AdminNavSection = {
  id: string
  title: string
  items: AdminNavItem[]
}
