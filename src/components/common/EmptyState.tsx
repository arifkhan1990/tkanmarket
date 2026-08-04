import { Search } from 'lucide-react'
import type * as React from 'react'

import { Button } from '@/components/ui/button'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; href?: string; onClick?: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const Icon = icon ?? <Search className="h-6 w-6 text-primary" aria-hidden />

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-surface-container-lowest p-10 text-center">
      <div aria-hidden>{Icon}</div>
      <div className="space-y-2">
        <div className="text-xl font-extrabold tracking-tight text-on-surface">{title}</div>
        {description ? <div className="text-sm text-on-surface-variant">{description}</div> : null}
      </div>
      {action ? (
        <div>
          {action.href ? (
            <Button asChild>
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      ) : null}
    </div>
  )
}

