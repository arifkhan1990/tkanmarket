import type { ReactNode } from 'react'

/**
 * Route group for admin UI. Authentication and shell live in `(authenticated)/layout.tsx`
 * so `/admin/login` stays reachable without a session.
 */
export default function AdminSegmentRootLayout({ children }: { children: ReactNode }) {
  return children
}
