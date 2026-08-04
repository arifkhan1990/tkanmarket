import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { auth } from '@/auth/auth'
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell'
import { AdminShellSuspenseFallback } from '@/components/admin/admin-shell-suspense-fallback'

/** Auth + session checks must not run during static prerender (breaks `next build`). */
export const dynamic = 'force-dynamic'

export default async function AdminAuthenticatedLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  return (
    <Suspense fallback={<AdminShellSuspenseFallback />}>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </Suspense>
  )
}
