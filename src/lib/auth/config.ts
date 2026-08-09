import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { z } from 'zod'
import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { users } from '@/db/schema/users.schema'
import { getAuthRequestMeta } from '@/lib/auth/request-meta'
import { verifyPassword } from '@/lib/auth/password'
import { verifyTotp } from '@/lib/auth/totp'
import { isValidRecoveryCode } from '@/lib/auth/recovery-codes'
import { AdminTotpRecoveryCodeService } from '@/services/admin-totp-recovery-codes.service'
import { AuthSecurityEventService } from '@/services/auth-security-event.service'

type UserRole = 'ADMIN' | 'SALES' | 'VIEWER'

const CredentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  totpCode: z.string().optional()
})

function resolveAuthTrustHost(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  if (process.env.AUTH_TRUST_HOST === 'true' || process.env.AUTH_TRUST_HOST === '1') {
    return true
  }
  // @auth/core only auto-enables trustHost from AUTH_URL, not NEXTAUTH_URL — breaks nginx/VPS.
  return Boolean(process.env.AUTH_URL ?? process.env.NEXTAUTH_URL)
}

export const authConfig = {
  /** Accept either name; `.env.example` documents `NEXTAUTH_SECRET`. */
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  /** Reverse proxy (CloudPanel, nginx): avoids UntrustedHost when NEXTAUTH_URL is set. */
  trustHost: resolveAuthTrustHost(),
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totpCode: { label: 'Authenticator code', type: 'text' }
      },
      async authorize(credentials) {
        try {
          const parsed = CredentialsSchema.safeParse(credentials)
          if (!parsed.success) return null

          const meta = await getAuthRequestMeta()

          const db = getDb()
          const rows = await db
            .select({
              id: users.id,
              email: users.email,
              name: users.name,
              role: users.role,
              passwordHash: users.passwordHash,
              totpSecret: users.totpSecret,
              totpEnabled: users.totpEnabled
            })
            .from(users)
            .where(and(eq(users.email, parsed.data.email), isNull(users.deletedAt)))
            .limit(1)

          let u = rows[0]
          if (!u) {
            await AuthSecurityEventService.record({
              email: parsed.data.email,
              eventType: 'login_failure',
              success: false,
              ip: meta.ip,
              userAgent: meta.userAgent,
              metadata: { reason: 'user_not_found' }
            })
            return null
          }

          if (!u.passwordHash) {
            await AuthSecurityEventService.record({
              userId: u.id,
              email: u.email,
              eventType: 'login_failure',
              success: false,
              ip: meta.ip,
              userAgent: meta.userAgent,
              metadata: { reason: 'no_password_hash' }
            })
            return null
          }

          const passwordOk = verifyPassword(parsed.data.password, u.passwordHash)

          if (!passwordOk) {
            await AuthSecurityEventService.record({
              userId: u.id,
              email: u.email,
              eventType: 'login_failure',
              success: false,
              ip: meta.ip,
              userAgent: meta.userAgent,
              metadata: { reason: 'invalid_credentials' }
            })
            return null
          }

          if (u.totpEnabled && u.totpSecret) {
            const candidate = parsed.data.totpCode?.trim() ?? ''
            const isSixDigits = /^\d{6}$/.test(candidate)

            let ok = false
            let reason = 'totp_invalid'

            if (isSixDigits) {
              ok = verifyTotp(u.totpSecret, candidate)
              reason = 'totp_invalid'
            } else if (isValidRecoveryCode(candidate)) {
              ok = await AdminTotpRecoveryCodeService.consumeForUser(u.id, candidate)
              reason = 'recovery_invalid'
            }

            if (!ok) {
              await AuthSecurityEventService.record({
                userId: u.id,
                email: u.email,
                eventType: 'login_failure',
                success: false,
                ip: meta.ip,
                userAgent: meta.userAgent,
                metadata: { reason }
              })
              return null
            }
          }

          await AuthSecurityEventService.record({
            userId: u.id,
            email: u.email,
            eventType: 'login_success',
            success: true,
            ip: meta.ip,
            userAgent: meta.userAgent,
            metadata: null
          })

          return {
            id: String(u.id),
            email: u.email,
            name: u.name,
            role: u.role as UserRole
          }
        } catch {
          return null
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: UserRole }).role
        token.name = user.name
        token.email = user.email
        token.sub = user.id
      }
      return token
    },
    session({ session, token }) {
      const role = token.role as UserRole | undefined

      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          role,
          name: token.name ?? session.user?.name,
          email: token.email ?? session.user?.email
        }
      }
    }
  },
  pages: {
    signIn: '/admin/login'
  }
} satisfies NextAuthConfig

