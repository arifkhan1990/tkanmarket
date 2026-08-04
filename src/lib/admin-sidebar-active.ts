function stripLocalePrefix(path: string) {
  return path.replace(/^\/(en|ru|zh)(?=\/|$)/, '')
}

function parsePath(input: string): { pathname: string; searchParams: URLSearchParams } {
  const url = new URL(input.startsWith('/') ? `http://local${input}` : input)
  return { pathname: url.pathname, searchParams: url.searchParams }
}

export function isAdminNavActive(currentPath: string, href: string): boolean {
  const { pathname: currentPathname, searchParams: currentSearch } = parsePath(stripLocalePrefix(currentPath))
  const { pathname: itemPathname, searchParams: itemSearch } = parsePath(stripLocalePrefix(href))

  const pathnameMatches =
    itemPathname === '/admin/inventory-health'
      ? currentPathname === '/admin/inventory-health'
      : itemPathname === '/admin/fabrics'
        ? currentPathname.startsWith('/admin/fabrics')
        : itemPathname === '/admin/leads'
          ? currentPathname === '/admin/leads'
        : itemPathname === '/admin/reports/custom-builder'
          ? currentPathname.startsWith('/admin/reports')
          : itemPathname === '/admin/global-shipping-logistics'
            ? currentPathname.startsWith('/admin/global-shipping-logistics')
            : itemPathname === '/admin/help-support'
              ? currentPathname.startsWith('/admin/help-support')
              : itemPathname === '/admin/job-queue'
                ? currentPathname.startsWith('/admin/job-queue') || currentPathname.startsWith('/admin/jobs')
                : itemPathname === '/admin/crawler/control'
                  ? currentPathname.startsWith('/admin/crawler')
                  : itemPathname === '/admin/supplier-verification'
                    ? currentPathname.startsWith('/admin/supplier-verification')
                    : itemPathname === '/admin/system-alert-config'
                      ? currentPathname.startsWith('/admin/system-alert-config')
                      : itemPathname === '/admin/suppliers'
                        ? currentPathname === '/admin/suppliers' || currentPathname.startsWith('/admin/suppliers/')
                        : itemPathname === '/admin/security/settings'
                          ? currentPathname.startsWith('/admin/security/settings') ||
                            currentPathname.startsWith('/admin/security/2fa')
                          : currentPathname.startsWith(itemPathname)

  if (!pathnameMatches) return false

  const itemEntries = Array.from(itemSearch.entries())
  if (itemEntries.length === 0) {
    if (itemPathname === '/admin/fabrics' && currentSearch.get('status') === 'ai_processed') return false
    if (itemPathname === '/admin/leads' && currentSearch.get('assigned') === 'me') return false
    return true
  }

  return itemEntries.every(([k, v]) => currentSearch.get(k) === v)
}
