import type { ReactNode } from 'react'

/**
 * Minimal shell for post-conversion pages (no site chrome — see Stitch “Destination Rule”).
 */
export default function ConversionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-on-surface flex min-h-screen flex-col antialiased">{children}</div>
  )
}
