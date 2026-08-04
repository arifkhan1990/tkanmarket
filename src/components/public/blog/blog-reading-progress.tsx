'use client'

import { useEffect, useState } from 'react'

type Props = {
  ariaLabel: string
}

export function BlogReadingProgress({ ariaLabel }: Props) {
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    const update = () => {
      const el = document.documentElement
      const scrollTop = el.scrollTop
      const scrollable = el.scrollHeight - el.clientHeight
      setPercent(scrollable > 0 ? Math.min(100, (scrollTop / scrollable) * 100) : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-14 z-40 h-0.5 bg-surface-container-high md:top-[4.25rem]"
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_rgba(26,64,194,0.35)] transition-[width] duration-150 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
