import { PublicPageShell } from '@/components/shared/public-page-shell'

export default function BlogLoading() {
  return (
    <PublicPageShell
      blur="sm"
      className="pb-10 pt-6 md:pb-14 md:pt-8"
      contentClassName="space-y-8 md:space-y-10"
    >
      <div className="h-4 w-40 animate-pulse rounded bg-surface-container-high" />
      <div className="h-[min(520px,75vh)] min-h-[280px] w-full animate-pulse rounded-[2rem] bg-surface-container-high md:h-[min(640px,80vh)] md:min-h-[360px]" />
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-surface-container-high md:w-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-surface-container-high" />
            <div className="h-4 w-24 animate-pulse rounded bg-surface-container-high" />
            <div className="h-7 w-full animate-pulse rounded bg-surface-container-high" />
            <div className="h-4 w-full animate-pulse rounded bg-surface-container-high" />
          </div>
        ))}
      </div>
    </PublicPageShell>
  )
}
