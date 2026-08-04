import { auth } from '@/lib/auth/config'
import { AuthError, ForbiddenError } from '@/lib/errors'
import { UserRole } from '@/types/enums'
import type { NextRequest } from 'next/server'

// ============================================================
// Get current session or throw AuthError
// ============================================================
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) throw new AuthError()
  return session
}

// ============================================================
// Require ADMIN or SALES role
// ============================================================
export async function requireAdminAuth() {
  const session = await requireAuth()
  const role    = session.user.role as UserRole
  const allowed = [UserRole.ADMIN, UserRole.SALES]
  if (!allowed.includes(role)) throw new ForbiddenError()
  return session
}

// ============================================================
// Require specific roles
// ============================================================
export async function requireRole(roles: UserRole[]) {
  const session = await requireAuth()
  const role    = session.user.role as UserRole
  if (!roles.includes(role)) throw new ForbiddenError()
  return session
}

// ============================================================
// Require ADMIN only
// ============================================================
export async function requireSuperAdmin() {
  return requireRole([UserRole.ADMIN])
}

// ============================================================
// Get session user ID as number (always integer)
// ============================================================
export async function getAuthUserId(): Promise<number> {
  const session = await requireAuth()
  return parseInt(session.user.id!, 10)
}
