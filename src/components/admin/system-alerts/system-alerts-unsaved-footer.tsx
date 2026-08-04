'use client'

import * as React from 'react'

export function countLeafDiffs(a: unknown, b: unknown): number {
  if (Object.is(a, b)) return 0
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return 1
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.max(a.length, b.length)
    let n = 0
    for (let i = 0; i < len; i += 1) {
      n += countLeafDiffs(a[i], b[i])
    }
    return n
  }
  if (Array.isArray(a) !== Array.isArray(b)) return 1
  const ao = a as Record<string, unknown>
  const bo = b as Record<string, unknown>
  const keys = new Set([...Object.keys(ao), ...Object.keys(bo)])
  let n = 0
  for (const k of keys) {
    n += countLeafDiffs(ao[k], bo[k])
  }
  return n
}

export function UnsavedFooterText({
  template,
  count,
  matrixLabel
}: {
  template: string
  count: number
  matrixLabel: string
}) {
  const withCount = template.replaceAll('{count}', String(count))
  const parts = withCount.split('{matrix}')
  if (parts.length !== 2) {
    return <>{withCount.replaceAll('{matrix}', matrixLabel)}</>
  }
  return (
    <>
      {parts[0]}
      <span className="font-bold">{matrixLabel}</span>
      {parts[1]}
    </>
  )
}
