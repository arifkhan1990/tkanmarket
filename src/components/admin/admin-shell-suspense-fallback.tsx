import { ADMIN_MAIN_CONTENT_PADDING_CLASS } from '@/lib/admin-layout'
import { cn } from '@/lib/utils'

/** Shown while streamed admin routes resolve — mirrors `AdminLayoutShell` chrome without client hooks. */
export function AdminShellSuspenseFallback() {
  return (
    <div
      className="admin-shell min-h-screen bg-background text-on-surface"
      aria-busy="true"
      aria-label="Loading admin"
    >
      <div
        className="fixed left-0 top-0 z-40 hidden h-full w-[var(--admin-sidebar-width)] border-r border-outline/10 bg-surface-container-lowest lg:block"
        aria-hidden
      />
      <div
        className="fixed top-0 right-0 z-50 h-[var(--admin-topbar-height)] border-b border-outline/10 bg-background/95 backdrop-blur-sm lg:left-[var(--admin-sidebar-width)]"
        aria-hidden
      >
        <div className="flex h-full items-center justify-end gap-2 px-4 sm:px-6">
          <div className="h-9 w-28 animate-pulse rounded-md bg-surface-container-high" />
          <div className="h-9 w-9 animate-pulse rounded-md bg-surface-container-high" />
        </div>
      </div>
      <main className="min-h-screen bg-background pb-[var(--admin-footer-height)] pt-[var(--admin-topbar-height)] lg:ml-[var(--admin-sidebar-width)]">
        <div className={cn(ADMIN_MAIN_CONTENT_PADDING_CLASS, 'space-y-6')}>
          <div className="space-y-2">
            <div className="h-9 max-w-md animate-pulse rounded-lg bg-surface-container-high" />
            <div className="h-4 max-w-xl animate-pulse rounded bg-surface-container-high" />
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-surface-container-lowest" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-container-lowest" />
            ))}
          </div>
        </div>
      </main>
      <div
        className="fixed bottom-0 right-0 z-30 h-[var(--admin-footer-height)] border-t border-outline/10 bg-background/90 backdrop-blur-md lg:left-[var(--admin-sidebar-width)]"
        aria-hidden
      />
    </div>
  )
}
