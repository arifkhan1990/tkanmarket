import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type BlurSize = 'none' | 'sm' | 'md'

type Props = {
  children: ReactNode
  /** Section wrapper classes (padding, etc.). */
  className?: string
  /** Inner container classes (e.g. spacing between breadcrumb and content). */
  contentClassName?: string
  blur?: BlurSize
  /** Full-bleed content (no max-width); use for split layouts like bulk inquiry. */
  fullWidth?: boolean
}

/**
 * Shared layout for public marketing pages: surface background + optional decorative blur (landing/blog style).
 */
export function PublicPageShell({ children, className, contentClassName, blur = 'md', fullWidth = false }: Props) {
  return (
    <section className={cn('relative overflow-hidden bg-surface', className)}>
      <div
        className={cn(
          'relative z-10 w-full',
          fullWidth ? '' : 'mx-auto max-w-screen-2xl px-6 md:px-8',
          contentClassName
        )}
      >
        {children}
      </div>
      {blur !== 'none' ? (
        <div
          className={cn(
            'pointer-events-none absolute right-0 top-1/4 rounded-full bg-primary/5 blur-3xl',
            blur === 'sm' && 'h-[min(360px,60vw)] w-[min(360px,60vw)] translate-x-1/3',
            blur === 'md' && 'h-[min(480px,70vw)] w-[min(480px,70vw)] translate-x-1/3'
          )}
          aria-hidden
        />
      ) : null}
    </section>
  )
}
