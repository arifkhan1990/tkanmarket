'use client'

import Link from 'next/link'
import { Bell, CircleHelp, SlidersHorizontal, User, Wrench } from 'lucide-react'

import { AdminLocaleSwitcher } from '@/components/admin/admin-locale-switcher'
import { useAdminLayout } from '@/components/admin/admin-layout-context'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

export function AdminQuickSettingsDrawer() {
  const { quickSettingsOpen, setQuickSettingsOpen } = useAdminLayout()
  const { messages } = useI18n()
  const t = messages.admin.topbar

  return (
    <Sheet open={quickSettingsOpen} onOpenChange={setQuickSettingsOpen}>
      <SheetContent side="right" className="flex w-[min(100vw-1rem,22rem)] flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
        <div className="border-b border-outline/10 px-6 pb-4 pt-2">
          <div className="flex items-center gap-3 pr-10">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <SlidersHorizontal className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {t.quickSettingsEyebrow}
              </p>
              <h2 className="truncate text-lg font-semibold tracking-tight text-on-surface">{t.quickSettingsTitle}</h2>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 px-6 py-6">
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{t.quickSettingsLanguage}</h3>
            <AdminLocaleSwitcher variant="inline" />
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{t.quickSettingsShortcuts}</h3>
            <nav className="flex flex-col gap-1" aria-label={t.quickSettingsShortcuts}>
              <SheetClose asChild>
                <Link
                  href="/admin/profile"
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface transition-colors',
                    'hover:bg-surface-container-high/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
                  )}
                >
                  <User className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden />
                  {messages.admin.topbar.profile}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <Wrench className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden />
                  {messages.admin.topbar.settings}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/admin/notification-settings"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <Bell className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden />
                  {messages.admin.sidebar.notificationSettings}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/admin/system/preferences"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <SlidersHorizontal className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden />
                  {messages.admin.sidebar.systemPreferences}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/admin/help-support"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <CircleHelp className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden />
                  {messages.admin.helpSupportPage.title}
                </Link>
              </SheetClose>
            </nav>
          </section>
        </div>

        <div className="mt-auto border-t border-outline/10 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => setQuickSettingsOpen(false)}
          >
            {t.quickSettingsDone}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
