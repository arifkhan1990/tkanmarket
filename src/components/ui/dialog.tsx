'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/useI18n'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({
  className,
  children,
  hideCloseButton,
  overlayClassName,
  srOnlyTitle,
  ...props
}: DialogPrimitive.DialogContentProps & {
  hideCloseButton?: boolean
  overlayClassName?: string
  /** Radix a11y: use when children do not include a visible DialogTitle. */
  srOnlyTitle?: string
}) {
  const { messages } = useI18n()
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn('fixed inset-0 bg-black/40 backdrop-blur-sm', overlayClassName)}
      />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-[50%] top-[50%] z-50 w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-3xl bg-surface-container-lowest p-6 shadow-soft outline-none sm:w-full',
          className
        )}
        {...props}
      >
        {srOnlyTitle ? (
          <DialogPrimitive.Title className="sr-only">{srOnlyTitle}</DialogPrimitive.Title>
        ) : null}
        {hideCloseButton ? null : (
          <div className="absolute right-4 top-4">
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label={messages.a11y.closeDialog} className="rounded-xl">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
        )}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <DialogPrimitive.Title className={cn('text-xl font-extrabold tracking-tight', className)} {...props} />
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <DialogPrimitive.Description className={cn('text-sm text-on-surface-variant', className)} {...props} />
  )
}

