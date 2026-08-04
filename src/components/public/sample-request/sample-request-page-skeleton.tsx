import { PublicPageShell } from '@/components/shared/public-page-shell'

export function SampleRequestPageSkeleton() {
  return (
    <PublicPageShell fullWidth blur="sm" contentClassName="p-0">
      <div className="mx-auto flex max-w-[1440px] animate-pulse flex-col gap-12 px-6 py-12 md:px-8 md:py-16 lg:flex-row lg:items-start lg:gap-16 lg:py-20 xl:gap-24">
        <div className="space-y-8 lg:w-[42%]">
          <div className="h-6 w-32 rounded-full bg-surface-container-highest" />
          <div className="h-12 w-full max-w-md rounded-lg bg-surface-container-highest" />
          <div className="h-24 w-full rounded-lg bg-surface-container-highest" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-28 rounded-2xl bg-surface-container-highest" />
            <div className="h-28 rounded-2xl bg-surface-container-highest" />
            <div className="h-28 rounded-2xl bg-surface-container-highest" />
            <div className="h-28 rounded-2xl bg-surface-container-highest" />
          </div>
          <div className="h-56 rounded-2xl bg-surface-container-highest md:h-64" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 md:p-10 lg:p-12">
            <div className="mb-10 flex justify-between md:mb-12">
              <div className="h-10 w-10 rounded-full bg-surface-container-highest" />
              <div className="h-10 w-10 rounded-full bg-surface-container-highest" />
              <div className="h-10 w-10 rounded-full bg-surface-container-highest" />
            </div>
            <div className="space-y-4">
              <div className="h-8 w-2/3 rounded bg-surface-container-highest" />
              <div className="h-4 w-full rounded bg-surface-container-high" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-11 rounded-xl bg-surface-container-highest" />
                <div className="h-11 rounded-xl bg-surface-container-highest" />
                <div className="h-11 rounded-xl bg-surface-container-highest" />
                <div className="h-11 rounded-xl bg-surface-container-highest" />
              </div>
            </div>
            <div className="mt-10 flex justify-between border-t border-surface-container-high pt-8">
              <div className="h-10 w-24 rounded-lg bg-surface-container-highest" />
              <div className="h-12 w-40 rounded-xl bg-surface-container-highest" />
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
