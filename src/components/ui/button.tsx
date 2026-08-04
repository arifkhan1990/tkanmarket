'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-soft hover:opacity-90',
        secondary: 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high',
        ghost: 'bg-transparent hover:bg-surface-container-low',
        outline: 'border border-outline bg-surface-container-lowest text-on-surface hover:bg-surface-container-highest',
        destructive: 'bg-error text-on-error shadow-sm hover:opacity-90',
        link: 'bg-transparent text-primary underline-offset-4 hover:underline px-0 h-auto py-0 font-semibold'
      },
      size: {
        default: 'px-6 py-2.5',
        sm: 'px-4 py-2',
        lg: 'px-8 py-4',
        icon: 'w-10 h-10 p-0'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    const typeProps = asChild ? {} : { type: type ?? 'button' }
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...typeProps}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

