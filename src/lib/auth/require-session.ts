import { auth } from '@/auth/auth'
import { AuthError } from '@/lib/errors'

import type { Session } from 'next-auth'

export async function requireSession(): Promise<Session> {
  const session = (await auth()) as Session | null

  if (!session?.user) {
    throw new AuthError('Authentication required')
  }

  return session
}
