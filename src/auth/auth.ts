import NextAuth from 'next-auth'

import { authConfig } from '@/auth/auth-options'

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

