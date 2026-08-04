import registryJson from './features.registry.json'
import stateJson from './features.state.json'

export type FeatureStatus = 'enabled' | 'disabled' | 'purged'

export type FeatureRegistryEntry = {
  id: string
  label: string
  description: string
  routes: string[]
  apiPaths: string[]
  adminPaths: string[]
  navKeys: string[]
  adminNavHrefs: string[]
  workers: string[]
  schemas: string[]
  files: string[]
}

export type FeatureStateMap = Record<string, FeatureStatus>

export type Feature = FeatureRegistryEntry & { status: FeatureStatus }

const registry = registryJson as FeatureRegistryEntry[]
const state = stateJson as FeatureStateMap

export function getAllFeatures(): Feature[] {
  return registry.map((entry) => ({
    ...entry,
    status: state[entry.id] ?? 'enabled'
  }))
}

export function getFeature(id: string): Feature | undefined {
  const entry = registry.find((f) => f.id === id)
  if (!entry) return undefined
  return { ...entry, status: state[id] ?? 'enabled' }
}

export function getFeatureStatus(id: string): FeatureStatus {
  return state[id] ?? 'enabled'
}

export function isFeatureEnabled(id: string): boolean {
  return getFeatureStatus(id) === 'enabled'
}
