'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'flex min-h-[120px] w-full resize-y rounded-xl bg-surface-container-highest px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all',
        className
      )}
      {...props}
    />
  )
}

