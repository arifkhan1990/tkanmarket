'use client'

import * as React from 'react'

import {
  COMPARE_LIST_CHANGED_EVENT,
  FABRIC_COMPARE_STORAGE_KEY,
  getStoredCompareIds
} from '@/lib/compare/compare-storage'

export function useFabricCompareNav() {
  const [ids, setIds] = React.useState<number[]>([])
  const [mounted, setMounted] = React.useState(false)

  const sync = React.useCallback(() => {
    setIds(getStoredCompareIds())
  }, [])

  React.useEffect(() => {
    sync()
    setMounted(true)
    window.addEventListener(COMPARE_LIST_CHANGED_EVENT, sync)
    const onStorage = (e: StorageEvent) => {
      if (e.key === FABRIC_COMPARE_STORAGE_KEY) sync()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(COMPARE_LIST_CHANGED_EVENT, sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [sync])

  // Until the client has read localStorage, expose count=0 so the badge
  // does not flash. `mounted` lets consumers gate the badge entirely.
  const count = mounted ? ids.length : 0
  /** Compare list lives in localStorage; keep the URL clean (no ?ids=). */
  const comparePath = '/fabrics/compare'

  return { count, ids, comparePath, mounted }
}
