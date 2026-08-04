'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

/** Lightweight scroll container (no Radix dependency). */
export function ScrollArea({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('overflow-auto', className)} {...props} />
}
