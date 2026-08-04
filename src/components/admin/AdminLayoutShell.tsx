'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

import { AdminQuickSettingsDrawer } from '@/components/admin/admin-quick-settings-drawer'
import { GlobalSearchOverlay } from '@/components/admin/global-search/GlobalSearchOverlay'
import { AdminDashboardFooter } from '@/components/admin/AdminDashboardFooter'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { AdminLayoutProvider } from '@/components/admin/admin-layout-context'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ADMIN_MAIN_CONTENT_PADDING_CLASS } from '@/lib/admin-layout'
import { cn } from '@/lib/utils'

export function AdminLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false)

  const sidebarWidthPx = collapsed ? 72 : 240

  const currentPath = useMemo(() => {
    const q = searchParams.toString()
    return q ? `${pathname}?${q}` : pathname
  }, [pathname, searchParams])

  return (
    <AdminLayoutProvider
      value={{
        collapsed,
        setCollapsed,
        toggleCollapsed: () => setCollapsed((v) => !v),
        sidebarWidthPx,
        mobileNavOpen,
        setMobileNavOpen,
        globalSearchOpen,
        setGlobalSearchOpen,
        quickSettingsOpen,
        setQuickSettingsOpen
      }}
    >
      <div className={cn('admin-shell min-h-screen bg-background text-on-surface', collapsed && 'is-collapsed')}>
        <TooltipProvider delayDuration={280}>
          <AdminSidebar currentPath={currentPath} />
          <AdminTopBar />
          <GlobalSearchOverlay />
          <AdminQuickSettingsDrawer />
          <main className="min-h-screen bg-background pb-[var(--admin-footer-height)] pt-[var(--admin-topbar-height)] lg:ml-[var(--admin-sidebar-width)]">
            <div className={cn(ADMIN_MAIN_CONTENT_PADDING_CLASS, 'w-full min-h-0')}>{children}</div>
          </main>
          <AdminDashboardFooter />
        </TooltipProvider>
      </div>
    </AdminLayoutProvider>
  )
}

