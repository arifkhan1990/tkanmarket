'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

export type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer h-5 w-5 shrink-0 rounded-md border border-outline/40 bg-surface-container-lowest shadow-sm data-[state=checked]:border-primary data-[state=checked]:bg-brand-500 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/20',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator aria-hidden>
        <Check className="h-3.5 w-3.5 text-on-primary" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

