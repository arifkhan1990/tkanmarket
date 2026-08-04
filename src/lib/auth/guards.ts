import type { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'

import { auth } from '@/auth/auth'
import { AuthError, ForbiddenError } from '@/lib/errors'

type Handler<TContext = unknown> = (req: NextRequest, context: TContext) => Promise<NextResponse> | NextResponse

export function requireAuth<TContext = unknown>(handler: Handler<TContext>): Handler<TContext> {
  return async (req, context) => {
    const session = await auth()
    if (!session?.user) throw new AuthError('Authentication required')
    return handler(req, context)
  }
}

export function requireRole(roles: Array<'ADMIN' | 'SALES' | 'VIEWER'>) {
  return function withRole<TContext = unknown>(handler: Handler<TContext>): Handler<TContext> {
    return async (req, context) => {
      const session = await auth()
      if (!session?.user) throw new AuthError('Authentication required')
      const role = session.user.role
      if (!role || !roles.includes(role)) {
        throw new ForbiddenError('Insufficient permissions')
      }
      return handler(req, context)
    }
  }
}

export function requireAdmin<TContext = unknown>(handler: Handler<TContext>): Handler<TContext> {
  return requireRole(['ADMIN', 'SALES'])(handler)
}

