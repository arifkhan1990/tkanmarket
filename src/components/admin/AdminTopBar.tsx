'use client'

import { Menu, PanelLeftClose, PanelLeftOpen, Search, SlidersHorizontal } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useSyncExternalStore } from 'react'

import { useAdminLayout } from '@/components/admin/admin-layout-context'
import { AdminLocaleSwitcher } from '@/components/admin/admin-locale-switcher'
import { NotificationBellDropdown } from '@/components/admin/notifications/NotificationBellDropdown'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import type { AdminTopBarProps } from '@/types/nav.types'

export function AdminTopBar({ pageTitle }: AdminTopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const session = useSession()
  const adminLayout = useAdminLayout()
  const { messages } = useI18n()

  const mounted = useSyncExternalStore(
    (onStoreChange) => {
      queueMicrotask(onStoreChange)
      return () => {}
    },
    () => true,
    () => false
  )

  const searchKbd = useMemo(() => {
    if (!mounted) return messages.admin.topbar.searchShortcutWin
    const mac =
      typeof navigator !== 'undefined' &&
      /Mac|iPhone|iPad|iPod/i.test(navigator.platform ?? navigator.userAgent ?? '')
    return mac ? messages.admin.topbar.searchShortcutMac : messages.admin.topbar.searchShortcutWin
  }, [mounted, messages.admin.topbar.searchShortcutMac, messages.admin.topbar.searchShortcutWin])

  const title = useMemo(() => {
    if (pageTitle) return pageTitle
    if (pathname.startsWith('/admin/dashboard')) return messages.admin.topbar.dashboard
    if (pathname.startsWith('/admin/fabrics')) return messages.admin.topbar.catalog
    if (pathname.startsWith('/admin/supplier-reviews')) return messages.admin.supplierSuite.reviewsPageTitle
    if (/^\/admin\/supplier-verification\/\d+/.test(pathname))
      return messages.admin.supplierSuite.verificationDetailTitle
    if (pathname.startsWith('/admin/supplier-verification')) return messages.admin.supplierSuite.verificationPageTitle
    if (pathname.startsWith('/admin/suppliers/withdrawals') || pathname.startsWith('/admin/supplier-withdrawals'))
      return messages.admin.supplierSuite.withdrawalsPageTitle
    if (pathname.startsWith('/admin/supplier-discovery')) return messages.admin.topbar.supplierDiscovery
    if (pathname.startsWith('/admin/suppliers')) return messages.admin.topbar.suppliers
    if (pathname.startsWith('/admin/leads/assignment-rules')) return messages.admin.leadAssignmentPage.title
    if (pathname.startsWith('/admin/leads/qualification')) return messages.admin.leadScoringPage.tabQualification
    if (pathname.startsWith('/admin/leads/scoring')) return messages.admin.leadScoringPage.title
    if (pathname.startsWith('/admin/leads')) return messages.admin.topbar.leads
    if (pathname.includes('/admin/social/') && pathname.includes('/preview'))
      return messages.admin.socialPreviewPage.title
    if (pathname.startsWith('/admin/social')) return messages.admin.topbar.social
    if (pathname.startsWith('/admin/crawler')) return messages.admin.topbar.crawler
    if (pathname.startsWith('/admin/profile')) return messages.admin.sidebar.profile
    if (pathname.startsWith('/admin/audit-log') || pathname.startsWith('/admin/audit-trail'))
      return messages.admin.sidebar.auditLog
    if (pathname.startsWith('/admin/team-performance')) return messages.admin.sidebar.teamPerformance
    if (pathname.startsWith('/admin/technical-diagnostics')) return messages.admin.sidebar.technicalDiagnostics
    if (pathname.startsWith('/admin/api-sandbox')) return messages.admin.sidebar.apiSandbox
    if (pathname.startsWith('/admin/teams')) return messages.admin.sidebar.teams
    if (pathname.startsWith('/admin/access')) return messages.admin.sidebar.accessControl
    if (pathname.startsWith('/admin/security/2fa')) return messages.admin.totpPage.title
    if (pathname.startsWith('/admin/security/settings')) return messages.admin.sidebar.securitySettings
    if (pathname.startsWith('/admin/security/auth-log')) return messages.admin.sidebar.securityAuthLog
    if (pathname.includes('/admin/system-alert-config')) return messages.admin.sidebar.systemAlertConfig
    if (pathname.startsWith('/admin/system-alerts')) return messages.admin.sidebar.systemAlerts
    if (pathname.startsWith('/admin/system/integrations')) return messages.admin.sidebar.systemIntegrations
    if (pathname.startsWith('/admin/system/logs')) return messages.admin.sidebar.systemLogs
    if (pathname.startsWith('/admin/system/preferences')) return messages.admin.sidebar.systemPreferences
    if (pathname.startsWith('/admin/system/platform-settings')) return messages.admin.sidebar.systemPlatformSettings
    if (pathname.startsWith('/admin/system/update-log')) return messages.admin.sidebar.systemUpdateLog
    if (pathname.startsWith('/admin/system/maintenance')) return messages.admin.sidebar.systemMaintenance
    if (pathname.startsWith('/admin/settings')) return messages.admin.topbar.settings
    if (pathname.startsWith('/admin/global-shipping-logistics')) return messages.admin.globalShippingPage.title
    if (pathname.startsWith('/admin/help-support')) return messages.admin.helpSupportPage.title
    if (pathname.startsWith('/admin/advanced-analytics')) return 'Analytics'
    if (pathname.startsWith('/admin/system-health')) return 'System Health'
    return messages.admin.topbar.admin
  }, [messages, pageTitle, pathname])

  const avatarSrc = session.data?.user?.image ?? undefined
  const displayName = session.data?.user?.name ?? session.data?.user?.email ?? 'User'
  const initials = (displayName.trim()[0] ?? 'U').toUpperCase()

  const searchKeyShortcuts = mounted ? 'Control+K Meta+K' : undefined

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-50 flex h-[var(--admin-topbar-height)] items-center justify-between gap-2',
        'border-b border-outline/10 bg-background/95 px-3 shadow-sm backdrop-blur-md sm:gap-3 sm:px-5',
        'lg:left-[var(--admin-sidebar-width)] lg:transition-[left] lg:duration-200'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-1 h-10 w-10 shrink-0 text-on-surface lg:hidden"
          aria-label={messages.admin.topbar.openMenu}
          onClick={() => adminLayout.setMobileNavOpen(true)}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hidden h-10 w-10 shrink-0 text-on-surface-variant hover:text-on-surface lg:inline-flex"
          aria-label={adminLayout.collapsed ? messages.admin.sidebar.expand : messages.admin.sidebar.collapse}
          onClick={() => adminLayout.toggleCollapsed()}
        >
          {adminLayout.collapsed ? (
            <PanelLeftOpen className="h-5 w-5" aria-hidden />
          ) : (
            <PanelLeftClose className="h-5 w-5" aria-hidden />
          )}
        </Button>

        <div className="flex min-w-0 max-w-[min(100%,14rem)] shrink-0 items-center gap-2 sm:max-w-[min(100%,18rem)] lg:max-w-[min(100%,13rem)] xl:max-w-[min(100%,16rem)]">
          <h1 className="min-w-0 truncate text-base font-semibold tracking-tight text-on-surface sm:text-lg">{title}</h1>
          <Badge
            intent="default"
            className="hidden shrink-0 border border-outline/20 bg-surface-container-high/50 px-2 py-0 text-[10px] font-medium uppercase tracking-wide text-on-surface-variant sm:inline-flex"
          >
            {messages.admin.sidebar.admin}
          </Badge>
        </div>

        <button
          type="button"
          className={cn(
            'mx-auto hidden h-10 min-w-0 w-full max-w-2xl flex-1 items-center gap-3 rounded-xl border border-outline/20 bg-surface-container-low/80 px-3.5 text-left text-sm shadow-sm ring-1 ring-black/[0.03] transition-all dark:ring-white/[0.06]',
            'hover:border-primary/25 hover:bg-surface-container-high/90 hover:shadow-md hover:ring-primary/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            'active:scale-[0.995]',
            'md:flex'
          )}
          onClick={() => adminLayout.setGlobalSearchOpen(true)}
          aria-label={messages.admin.globalSearch.openSearch}
          aria-keyshortcuts={searchKeyShortcuts}
        >
          <Search className="h-4 w-4 shrink-0 text-primary/90" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-on-surface-variant">
            {messages.admin.topbar.searchBarPlaceholder}
          </span>
          <kbd className="pointer-events-none hidden shrink-0 rounded-md border border-outline/25 bg-background/95 px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-on-surface-variant sm:inline-flex">
            {searchKbd}
          </kbd>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          aria-label={messages.admin.topbar.openQuickSettings}
          onClick={() => adminLayout.setQuickSettingsOpen(true)}
        >
          <SlidersHorizontal className="h-[1.125rem] w-[1.125rem]" aria-hidden />
        </Button>

        <AdminLocaleSwitcher variant="dropdown" />

        <Button
          variant="outline"
          size="sm"
          className="hidden h-9 gap-2 rounded-lg border-outline/20 bg-surface-container-low/80 px-3 text-on-surface-variant shadow-sm hover:bg-surface-container-high sm:inline-flex md:hidden"
          aria-label={messages.admin.globalSearch.openSearch}
          aria-keyshortcuts={searchKeyShortcuts}
          onClick={() => adminLayout.setGlobalSearchOpen(true)}
        >
          <Search className="h-4 w-4 shrink-0 text-primary/90" aria-hidden />
          <span className="text-xs font-medium">{messages.admin.globalSearch.openSearch}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 sm:hidden"
          aria-label={messages.admin.globalSearch.openSearch}
          aria-keyshortcuts={searchKeyShortcuts}
          onClick={() => adminLayout.setGlobalSearchOpen(true)}
        >
          <Search className="h-4 w-4 text-primary/90" aria-hidden />
        </Button>

        <NotificationBellDropdown />

        <span className="hidden h-6 w-px bg-outline/20 sm:block" aria-hidden />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full ring-1 ring-outline/10 hover:bg-surface-container-high/80 hover:ring-outline/20"
              aria-label={messages.admin.topbar.openUserMenu}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarSrc ?? ''} alt={messages.admin.topbar.userAvatar} />
                <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[12rem]">
            <DropdownMenuLabel className="max-w-[240px] truncate font-normal">
              <span className="block text-xs text-on-surface-variant">{messages.admin.topbar.openUserMenu}</span>
              <span className="font-medium text-on-surface">{displayName}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/profile">{messages.admin.topbar.profile}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">{messages.admin.topbar.settings}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/help-support">{messages.admin.helpSupportPage.title}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                void signOut({ redirect: false }).then(() => router.push('/admin/login'))
              }}
            >
              {messages.admin.topbar.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
