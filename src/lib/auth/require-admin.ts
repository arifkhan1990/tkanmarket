import { auth } from '@/auth/auth'
import { AuthError, ForbiddenError } from '@/lib/errors'

import type { Session } from 'next-auth'

export async function requireAdminSession(): Promise<Session> {
  const session = (await auth()) as Session | null

  if (!session?.user) {
    throw new AuthError('Admin authentication required')
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SALES') {
    throw new ForbiddenError('Admin access required')
  }

  return session
}

/** Mutations that change users, roles, or security settings (ADMIN-only). */
export async function requireAdminOnlySession(): Promise<Session> {
  const session = (await auth()) as Session | null

  if (!session?.user) {
    throw new AuthError('Admin authentication required')
  }

  if (session.user.role !== 'ADMIN') {
    throw new ForbiddenError('Administrator role required')
  }

  return session
}

