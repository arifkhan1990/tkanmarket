export interface AdminSandboxEndpoint {
  id: string
  method: 'GET'
  path: string
  descriptionKey: 'stats' | 'categories' | 'dashboard' | 'teams' | 'crawlerDiag'
}

/** Read-only routes validated against this catalog in the sandbox UI. */
export const ADMIN_API_SANDBOX_ENDPOINTS: readonly AdminSandboxEndpoint[] = [
  {
    id: 'pub-stats',
    method: 'GET',
    path: '/api/v1/public/stats',
    descriptionKey: 'stats'
  },
  {
    id: 'fabrics-cat-count',
    method: 'GET',
    path: '/api/v1/fabrics/categories/count',
    descriptionKey: 'categories'
  },
  {
    id: 'admin-dash',
    method: 'GET',
    path: '/api/v1/admin/dashboard',
    descriptionKey: 'dashboard'
  },
  {
    id: 'admin-teams',
    method: 'GET',
    path: '/api/v1/admin/teams',
    descriptionKey: 'teams'
  },
  {
    id: 'crawler-diag',
    method: 'GET',
    path: '/api/v1/admin/crawler/diagnostics',
    descriptionKey: 'crawlerDiag'
  }
] as const
