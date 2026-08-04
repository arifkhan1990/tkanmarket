import { redirect } from 'next/navigation'

import { requireAdminSession } from '@/lib/auth/require-admin'

export async function requireAdminOrRedirect() {
  try {
    await requireAdminSession()
  } catch {
    redirect('/admin/login')
  }
}

