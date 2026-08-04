import { PublicAuthBackdrop } from '@/components/public/auth/public-auth-backdrop'

type PublicAuthFormSkeletonProps = {
  /** Number of tall input rows (e.g. 1 = reset password only, 2 = invite name + password). */
  fields?: 1 | 2
}

/**
 * Loading UI aligned with `PublicAuthFormShell` (glass card + backdrop) for Suspense fallbacks.
 */
export function PublicAuthFormSkeleton({ fields = 1 }: PublicAuthFormSkeletonProps) {
  return (
    <div className="relative mx-auto max-w-lg px-6 py-12 md:py-16" aria-hidden>
      <PublicAuthBackdrop />
      <div className="glass-card relative z-10 rounded-[2rem] border border-white/40 p-10 shadow-xl shadow-on-surface/5 dark:border-white/10">
        <div className="h-9 w-56 max-w-full animate-pulse rounded-lg bg-surface-container-high/90 dark:bg-surface-container-highest/50" />
        <div className="mt-2 h-4 w-full max-w-sm animate-pulse rounded bg-surface-container-high dark:bg-surface-container-highest/40" />
        <div className="mt-8 space-y-4">
          {fields === 2 ? (
            <>
              <div className="h-14 w-full animate-pulse rounded-xl bg-surface-container-high dark:bg-surface-container-highest/40" />
              <div className="h-14 w-full animate-pulse rounded-xl bg-surface-container-high dark:bg-surface-container-highest/40" />
            </>
          ) : (
            <div className="h-14 w-full animate-pulse rounded-xl bg-surface-container-high dark:bg-surface-container-highest/40" />
          )}
        </div>
        <div className="mt-8 h-12 w-full animate-pulse rounded-xl bg-surface-container-high/80 dark:bg-surface-container-highest/50" />
        <div className="mt-8 border-t border-outline-variant/15 pt-8">
          <div className="mx-auto h-4 w-36 animate-pulse rounded bg-surface-container-high dark:bg-surface-container-highest/40" />
        </div>
      </div>
    </div>
  )
}
