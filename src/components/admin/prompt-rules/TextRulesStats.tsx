'use client'

interface TextRulesStatsProps {
  totalCount: number
  activeCount: number
  inactiveCount: number
  defaultCount: number
}

export function TextRulesStats({
  totalCount,
  activeCount,
  inactiveCount,
  defaultCount
}: TextRulesStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-xs">
        <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Total Text Rules</div>
        <div className="mt-2 text-2xl font-extrabold text-on-surface">{totalCount}</div>
      </div>
      <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-xs">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Active Rules
        </div>
        <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
      </div>
      <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-xs">
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          Inactive Rules
        </div>
        <div className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">{inactiveCount}</div>
      </div>
      <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-xs">
        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Default/Catch-All
        </div>
        <div className="mt-2 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{defaultCount}</div>
      </div>
    </div>
  )
}
