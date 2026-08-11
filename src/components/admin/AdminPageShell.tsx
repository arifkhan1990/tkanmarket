import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type AdminPageShellProps = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function AdminPageShell({ title, description, actions, children, className }: AdminPageShellProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">{title}</h1>
          {description ? <p className="mt-1 text-sm text-on-surface-variant">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  )
}
