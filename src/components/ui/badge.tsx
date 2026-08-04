'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  intent?: 'default' | 'success' | 'warning' | 'error' | 'brand'
}

const intentToClasses: Record<NonNullable<BadgeProps['intent']>, string> = {
  default: 'bg-surface-container-low text-on-surface-variant',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  brand: 'bg-brand-50 text-brand-700'
}

export function Badge({ className, intent = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest',
        intentToClasses[intent],
        className
      )}
      {...props}
    />
  )
}

