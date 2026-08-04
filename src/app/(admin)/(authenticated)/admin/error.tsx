'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/useI18n'
import { logger } from '@/lib/logger'

export default function AdminSectionError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { messages } = useI18n()
  const t = messages.admin.segmentError

  useEffect(() => {
    logger.error('admin segment error', { message: error.message, digest: error.digest })
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h2 className="max-w-md text-lg font-semibold text-on-surface">{t.title}</h2>
      <p className="max-w-sm text-sm text-on-surface-variant">{t.description}</p>
      <Button type="button" onClick={() => reset()}>
        {t.retry}
      </Button>
    </div>
  )
}
