'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { AdminNavItem } from '@/types/admin-nav.types'

export function AdminSidebarLink({
  item,
  collapsed,
  active,
  badges,
  onNavigate,
  variant = 'default'
}: {
  item: AdminNavItem
  collapsed: boolean
  active: boolean
  badges: { fabricsPendingReview: number } | undefined
  onNavigate?: () => void
  variant?: 'default' | 'featured'
}) {
  const mounted = useSyncExternalStore(
    (onStoreChange) => {
      queueMicrotask(onStoreChange)
      return () => {}
    },
    () => true,
    () => false
  )

  const Icon = item.icon
  const badgeValue =
    item.badgeKey && badges ? badges[item.badgeKey] : item.badgeKey ? 0 : undefined

  const showFeatured = variant === 'featured' && !collapsed

  const inner = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'sidebar-link group relative flex cursor-pointer items-center gap-3 rounded-[10px]',

        collapsed && 'justify-center rounded-lg p-2',

        showFeatured && [
          'px-3 py-2.5',
          active
            ? 'bg-primary/15 text-primary'
            : 'bg-primary/[0.06] text-on-surface'
        ],

        !showFeatured && [
          'px-3 py-[7px] text-sm',
          !collapsed && 'min-h-[2.25rem]',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-on-surface-variant/80'
        ],

        !showFeatured && collapsed && active && 'bg-primary/10 text-primary',
        !showFeatured && collapsed && !active && 'text-on-surface-variant/70'
      )}
    >
      {active && !collapsed && !showFeatured ? (
        <span className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-r-full bg-primary" />
      ) : null}

      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0',
          showFeatured && 'text-primary',
          !showFeatured && active && 'text-primary',
          !showFeatured && !active && 'text-on-surface-variant/50'
        )}
      />

      {!collapsed ? (
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-left',
            showFeatured && 'font-medium',
            !showFeatured && active && 'font-medium'
          )}
        >
          {mounted ? item.label : ''}
        </span>
      ) : null}

      {typeof badgeValue === 'number' && badgeValue > 0 && collapsed ? (
        <span
          className="absolute right-1 top-1 h-[7px] w-[7px] rounded-full bg-primary shadow-[0_0_0_2px_var(--tm-surface-container-lowest)]"
          aria-hidden
        />
      ) : null}
      {typeof badgeValue === 'number' && badgeValue > 0 && !collapsed ? (
        <Badge intent="warning" className="ml-auto shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold tabular-nums leading-5">
          {badgeValue > 99 ? '99+' : badgeValue}
        </Badge>
      ) : null}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={8}
          className="rounded-lg border-outline/10 px-3 py-1.5 text-sm font-medium shadow-lg"
        >
          {mounted ? item.label : ''}
        </TooltipContent>
      </Tooltip>
    )
  }

  return inner
}
