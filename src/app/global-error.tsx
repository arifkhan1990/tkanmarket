'use client'

import { useEffect } from 'react'

import { logger } from '@/lib/logger'

/**
 * Renders outside the root layout when the root layout itself fails.
 * Must not use React context (no `useI18n`, etc.). Keep copy in sync with `error.tsx` fallback strings.
 */
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Root layout error', { message: error.message, digest: error.digest })
  }, [error])

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, minHeight: '100vh' }}>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: '#f7f9ff',
            color: '#181c20'
          }}
        >
          <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Error
          </p>
          <h1 style={{ marginTop: '0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>Something went wrong</h1>
          <p style={{ marginTop: '0.5rem', maxWidth: '28rem', textAlign: 'center', opacity: 0.85 }}>
            We’re already working on a fix. Try again, or return to the home page.
          </p>
          <button
            type="button"
            style={{
              marginTop: '1.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              padding: '0.75rem 1.5rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: '#1a40c2',
              color: '#fff'
            }}
            onClick={() => reset()}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
