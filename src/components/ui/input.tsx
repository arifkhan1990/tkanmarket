'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-xl bg-surface-container-highest px-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-all focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20',
        className
      )}
      {...props}
    />
  )
})

