'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'

import { LocalePreferenceProvider } from '@/lib/i18n/locale-preference-context'
import type { Locale } from '@/types/i18n.types'

export function Providers({ children, serverLocale }: { children: ReactNode; serverLocale: Locale }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false
          }
        }
      })
  )

  return (
    <SessionProvider>
      <LocalePreferenceProvider locale={serverLocale}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster richColors />
        </QueryClientProvider>
      </LocalePreferenceProvider>
    </SessionProvider>
  )
}

