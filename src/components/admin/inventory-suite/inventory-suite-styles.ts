import { cn } from '@/lib/utils'

/** Panel card — light surface on dark admin shell */
export function invPanel(className?: string) {
  return cn(
    'rounded-2xl border border-outline/15 bg-surface-container-lowest shadow-sm',
    className
  )
}

export function invPanelMuted(className?: string) {
  return cn(
    'rounded-2xl border border-outline/15 bg-surface-container-low shadow-sm',
    className
  )
}

export function invPanelFlat(className?: string) {
  return cn('rounded-xl border border-outline/15 bg-surface-container-lowest shadow-sm', className)
}

export function invPageWrap(className?: string) {
  // AdminLayoutShell already applies the canonical horizontal inset (same as /admin/dashboard).
  // Inventory suite pages should only control max width + vertical rhythm here.
  return cn('mx-auto max-w-[1600px] space-y-6 pb-10 text-on-surface', className)
}

export const invText = {
  title: 'text-on-surface',
  body: 'text-on-surface-variant',
  muted: 'text-outline',
  strong: 'text-on-surface'
} as const

export function invTableWrap(className?: string) {
  return cn(
    'mt-8 overflow-hidden rounded-xl border border-outline/15 bg-surface-container-lowest shadow-sm',
    className
  )
}
