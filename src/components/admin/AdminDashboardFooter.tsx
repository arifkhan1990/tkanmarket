'use client'

import { useI18n } from '@/hooks/useI18n'
import { ADMIN_MAIN_CONTENT_HORIZONTAL_PADDING_CLASS } from '@/lib/admin-layout'
import { getAppVersion } from '@/lib/app-version'
import { cn } from '@/lib/utils'

export function AdminDashboardFooter() {
  const { messages } = useI18n()
  const year = new Date().getFullYear()
  const version = getAppVersion()
  const text = messages.admin.dashboardFooter.copyrightLine
    .replace('{year}', String(year))
    .replace('{version}', version)

  return (
    <footer
      className={cn(
        'fixed bottom-0 inset-x-0 z-30 flex h-[var(--admin-footer-height)] w-full items-center border-t border-outline/10 bg-background/90 backdrop-blur-md lg:left-[var(--admin-sidebar-width)] lg:transition-[left] lg:duration-200',
        ADMIN_MAIN_CONTENT_HORIZONTAL_PADDING_CLASS
      )}
      role="contentinfo"
    >
      <p className="w-full min-w-0 truncate px-1 text-center text-[11px] text-on-surface-variant sm:text-left">{text}</p>
    </footer>
  )
}
