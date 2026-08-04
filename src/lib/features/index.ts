import {
  getAllFeatures,
  getFeature,
  getFeatureStatus,
  isFeatureEnabled,
  type Feature,
  type FeatureStatus
} from '@/config/features'

export { getAllFeatures, getFeature, getFeatureStatus, isFeatureEnabled }
export type { Feature, FeatureStatus }

function patternToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escaped}(?:/.*)?$`)
}

function matchesAny(patterns: string[], path: string): boolean {
  return patterns.some((p) => {
    if (p.includes('(') || p.includes('*')) {
      try {
        return patternToRegex(p).test(path)
      } catch {
        return false
      }
    }
    return path === p || path.startsWith(`${p}/`)
  })
}

export function findDisabledFeatureForRoute(pathname: string): Feature | null {
  const features = getAllFeatures()
  for (const f of features) {
    if (f.status === 'enabled') continue
    if (matchesAny(f.routes, pathname)) return f
    if (matchesAny(f.adminPaths, pathname)) return f
  }
  return null
}

export function findDisabledFeatureForApi(pathname: string): Feature | null {
  const features = getAllFeatures()
  for (const f of features) {
    if (f.status === 'enabled') continue
    if (matchesAny(f.apiPaths, pathname)) return f
  }
  return null
}

export function isNavKeyEnabled(key: string): boolean {
  const features = getAllFeatures()
  for (const f of features) {
    if (f.navKeys.includes(key) && f.status !== 'enabled') return false
  }
  return true
}

export function isAdminNavHrefEnabled(href: string): boolean {
  const features = getAllFeatures()
  for (const f of features) {
    if (f.status === 'enabled') continue
    if (f.adminNavHrefs.some((h) => href === h || href.startsWith(`${h}/`))) return false
  }
  return true
}

export function isWorkerEnabled(workerName: string): boolean {
  const features = getAllFeatures()
  for (const f of features) {
    if (f.workers.includes(workerName) && f.status !== 'enabled') return false
  }
  return true
}
