'use client'

import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/useI18n'

export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetClose = SheetPrimitive.Close

export function SheetContent({
  className,
  side = 'right',
  children,
  ...props
}: SheetPrimitive.DialogContentProps & { side?: 'left' | 'right' | 'bottom' | 'top' }) {
  const { messages } = useI18n()
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
      <SheetPrimitive.Content
        className={cn(
          'fixed z-50 rounded-[2rem] bg-surface-container-lowest p-6 shadow-soft outline-none',
          side === 'right'
            ? 'top-0 right-0 h-full w-[90vw] max-w-sm'
            : side === 'left'
              ? 'top-0 left-0 h-full w-[90vw] max-w-sm'
              : side === 'bottom'
                ? 'left-0 right-0 bottom-0 w-full max-h-[85vh]'
                : 'left-0 right-0 top-0 w-full max-h-[85vh]',
          className
        )}
        {...props}
      >
        <SheetPrimitive.Title className="sr-only">{messages.a11y.sheetTitle}</SheetPrimitive.Title>
        <div className="absolute right-4 top-4">
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label={messages.a11y.closeSheet} className="rounded-xl">
              <span aria-hidden>×</span>
            </Button>
          </SheetClose>
        </div>
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1', className)} {...props} />
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-extrabold tracking-tight', className)} {...props} />
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-2', className)}
      {...props}
    />
  )
}

