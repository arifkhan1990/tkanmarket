'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { LogOut, Search, X } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

import { AdminSidebarLink } from '@/components/admin/admin-sidebar-link'
import { buildAdminNavSections } from '@/config/admin-sidebar-nav'
import { isAdminNavHrefEnabled } from '@/lib/features'
import { cn } from '@/lib/utils'
import { isAdminNavActive } from '@/lib/admin-sidebar-active'
import type { AdminSidebarProps } from '@/types/nav.types'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAdminSidebarBadges } from '@/hooks/admin/useAdminSidebarBadges'
import { useAdminLayout } from '@/components/admin/admin-layout-context'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useI18n } from '@/hooks/useI18n'
import type { Messages } from '@/lib/i18n/get-messages'

export function AdminSidebar({ currentPath, className, onNavigate }: AdminSidebarProps) {
  const { collapsed, mobileNavOpen, setMobileNavOpen } = useAdminLayout()
  const badgesQuery = useAdminSidebarBadges()
  const badges = badgesQuery.data
  const { messages } = useI18n()

  const sections = useMemo(() => {
    const all = buildAdminNavSections(messages)
    return all
      .map((section) => ({ ...section, items: section.items.filter((item) => isAdminNavHrefEnabled(item.href)) }))
      .filter((section) => section.items.length > 0)
  }, [messages])

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-full w-[var(--admin-sidebar-width)] lg:block',
          'admin-sidebar-surface border-r border-outline/[0.05] transition-[width] duration-200 ease-out',
          className
        )}
        aria-label={messages.admin.sidebar.navLandmark}
      >
        <SidebarBody
          collapsed={collapsed}
          sections={sections}
          currentPath={currentPath}
          badges={badges}
          messages={messages}
          onNavigate={onNavigate}
        />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[min(100vw-1.5rem,18rem)] border-outline/[0.05] p-0 sm:max-w-none"
        >
          <div className="admin-sidebar-surface h-full">
            <SidebarBody
              collapsed={false}
              sections={sections}
              currentPath={currentPath}
              badges={badges}
              messages={messages}
              onNavigate={() => {
                onNavigate?.()
                setMobileNavOpen(false)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function SidebarBody({
  collapsed,
  sections,
  currentPath,
  badges,
  messages,
  onNavigate
}: {
  collapsed: boolean
  sections: ReturnType<typeof buildAdminNavSections>
  currentPath: string
  badges: { fabricsPendingReview: number } | undefined
  messages: Messages
  onNavigate?: () => void
}) {
  const [navFilter, setNavFilter] = useState('')

  const filterActive = navFilter.trim().length > 0
  const q = navFilter.trim().toLowerCase()

  const filteredSections = useMemo(() => {
    if (!filterActive) return sections
    return sections
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (i) => i.label.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
        )
      }))
      .filter((s) => s.items.length > 0)
  }, [sections, filterActive, q])

  const flatItems = useMemo(() => filteredSections.flatMap((s) => s.items), [filteredSections])

  const overviewSection = filteredSections.find((s) => s.id === 'overview')
  const dashboardItem = overviewSection?.items[0]
  const groupedSections = filteredSections.filter((s) => s.id !== 'overview')

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Brand */}
      <div
        className={cn(
          'flex shrink-0 items-center px-4',
          collapsed ? 'justify-center py-4' : 'gap-3 py-5'
        )}
      >
        <Link
          href="/admin/dashboard"
          className={cn(
            'group flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80',
            collapsed && 'justify-center'
          )}
          onClick={onNavigate}
        >
          <div
            className={cn(
              'primary-gradient flex shrink-0 items-center justify-center font-bold text-on-primary',
              collapsed
                ? 'h-9 w-9 rounded-[10px] text-sm shadow-sm'
                : 'h-[38px] w-[38px] rounded-[10px] text-[15px] shadow-md shadow-primary/20'
            )}
            aria-hidden
          >
            T
          </div>
          {collapsed ? null : (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight text-on-surface">
                {messages.common.brand}
              </div>
              <div className="text-[11px] text-on-surface-variant/50">
                {messages.admin.sidebar.admin}
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Search */}
      {!collapsed ? (
        <div className="shrink-0 px-3 pb-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-on-surface-variant/40"
              aria-hidden
            />
            <Input
              value={navFilter}
              onChange={(e) => setNavFilter(e.target.value)}
              placeholder={messages.admin.sidebar.navFilterPlaceholder}
              className={cn(
                'h-8 rounded-lg border-0 bg-on-surface/[0.03] pl-8 pr-8 text-sm text-on-surface',
                'placeholder:text-on-surface-variant/40',
                'focus-visible:bg-on-surface/[0.05] focus-visible:ring-1 focus-visible:ring-primary/20',
                'dark:bg-white/[0.04] dark:focus-visible:bg-white/[0.06]'
              )}
              aria-label={messages.admin.sidebar.navFilterPlaceholder}
            />
            {filterActive ? (
              <button
                type="button"
                onClick={() => setNavFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-on-surface-variant/40 transition-colors hover:bg-on-surface/[0.06] hover:text-on-surface-variant"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Divider after header */}
      <div className="mx-3 mb-1 border-t border-on-surface/[0.04] dark:border-white/[0.04]" />

      {/* Navigation */}
      <nav className="admin-sidebar-scroll flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-1">
        {collapsed ? (
          <div className="flex flex-col gap-0.5 px-0.5">
            {flatItems.map((item) => (
              <AdminSidebarLink
                key={`${item.href}-${item.label}`}
                item={item}
                collapsed
                active={isAdminNavActive(currentPath, item.href)}
                badges={badges}
                onNavigate={onNavigate}
                variant={item.href === '/admin/dashboard' ? 'featured' : 'default'}
              />
            ))}
          </div>
        ) : (
          <>
            {dashboardItem ? (
              <div className="mb-2">
                <AdminSidebarLink
                  item={dashboardItem}
                  collapsed={false}
                  active={isAdminNavActive(currentPath, dashboardItem.href)}
                  badges={badges}
                  onNavigate={onNavigate}
                  variant="featured"
                />
              </div>
            ) : null}

            <div className="flex min-h-0 flex-1 flex-col gap-5">
              {filterActive && flatItems.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10">
                  <Search className="h-5 w-5 text-on-surface-variant/25" />
                  <p className="text-sm text-on-surface-variant/50">
                    {messages.admin.sidebar.navFilterEmpty}
                  </p>
                </div>
              ) : (
                groupedSections.map((section) => (
                  <div key={section.id}>
                    <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-[0.12em] text-on-surface-variant/35">
                      {section.title}
                    </p>
                    <div className="flex flex-col gap-[1px]">
                      {section.items.map((item) => (
                        <AdminSidebarLink
                          key={`${section.id}-${item.href}-${item.label}`}
                          item={item}
                          collapsed={false}
                          active={isAdminNavActive(currentPath, item.href)}
                          badges={badges}
                          onNavigate={onNavigate}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </nav>

      {/* User profile footer */}
      <SidebarUserFooter collapsed={collapsed} onNavigate={onNavigate} />
    </div>
  )
}

function SidebarUserFooter({
  collapsed,
  onNavigate
}: {
  collapsed: boolean
  onNavigate?: () => void
}) {
  const session = useSession()
  const { messages } = useI18n()

  const user = session.data?.user
  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'User'
  const email = user?.email ?? ''
  const avatarSrc = user?.image ?? undefined
  const initials = (displayName.trim()[0] ?? 'U').toUpperCase()

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/admin/login' })
    } catch {
      /* signOut redirects — errors are expected */
    }
  }

  if (collapsed) {
    return (
      <div className="shrink-0 px-3 pb-3">
        <div className="mb-2 border-t border-on-surface/[0.04] dark:border-white/[0.04]" />
        <div className="flex flex-col items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/admin/profile"
                onClick={onNavigate}
                className="sidebar-link flex items-center justify-center rounded-lg p-1.5"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarSrc ?? ''} alt={displayName} />
                  <AvatarFallback className="text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="rounded-lg border-outline/10 px-3 py-1.5 text-sm font-medium shadow-lg">
              {displayName}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleSignOut}
                className="sidebar-link flex items-center justify-center rounded-lg p-2 text-on-surface-variant/60"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="rounded-lg border-outline/10 px-3 py-1.5 text-sm font-medium shadow-lg">
              {messages.admin.topbar.logout}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    )
  }

  return (
    <div className="shrink-0 px-3 pb-3">
      <div className="mb-2 border-t border-on-surface/[0.04] dark:border-white/[0.04]" />
      <Link
        href="/admin/profile"
        onClick={onNavigate}
        className="sidebar-link flex items-center gap-3 rounded-[10px] px-3 py-2"
      >
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={avatarSrc ?? ''} alt={displayName} />
          <AvatarFallback className="text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-on-surface">{displayName}</p>
          <p className="truncate text-[11px] text-on-surface-variant/50">{email}</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSignOut()
          }}
          className="shrink-0 rounded-md p-1.5 text-on-surface-variant/40 transition-colors hover:bg-on-surface/[0.06] hover:text-on-surface-variant"
          aria-label={messages.admin.topbar.logout}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </Link>
    </div>
  )
}
