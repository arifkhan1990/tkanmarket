# Feature Flag System

Soft-disable + reversible purge for non-core features. Lets you hide features from the client/APIs without deleting code, then permanently purge later with one command.

## Files

- `src/config/features.registry.json` — feature metadata (routes, files, schemas). Edit to add a feature.
- `src/config/features.state.json` — runtime status per feature (mutated by CLI). Commit to version control.
- `src/config/features.ts` — TypeScript loader + types.
- `src/lib/features/index.ts` — runtime helpers used by middleware, API wrappers, nav components, workers.
- `src/lib/features/with-feature.ts` — optional API route guard wrapper.
- `scripts/feature-cli.mjs` — the CLI.

## Three statuses

| Status     | Client access | APIs        | Files        | DB tables    |
| ---------- | ------------- | ----------- | ------------ | ------------ |
| `enabled`  | Yes           | Yes         | Present      | Present      |
| `disabled` | 404           | 404 JSON    | Present      | Present      |
| `purged`   | 404           | 404 JSON    | **Deleted**  | Drop migration emitted |

Default is `enabled` for features not listed in `features.state.json`.

## Runtime behavior

**`proxy.ts`** — checks every request:

- Public/admin path matching a disabled feature's `routes` or `adminPaths` → rewrites to `/not-found` with HTTP 404.
- API path matching a disabled feature's `apiPaths` → returns `{ success: false, error: { code: 'FEATURE_DISABLED' } }` with 404.

**`AdminSidebar.tsx`** — filters out nav items whose `href` appears in any disabled feature's `adminNavHrefs`. Empty sections collapse.

**`Header.tsx`** — filters public nav items whose `key` appears in any disabled feature's `navKeys`.

**`workers/index.ts`** — skips worker registration for any worker name in a disabled feature's `workers` list.

## CLI

```bash
npm run feature:list                          # show status of everything
npm run feature:disable <id>                  # hide from client (status: disabled)
npm run feature:enable <id>                   # re-enable (status: enabled)
npm run feature:purge <id> -- --dry-run       # preview files + tables that would be deleted
npm run feature:purge <id> -- --yes           # hard-delete files + emit DROP TABLE migration
```

Notes:

- `purge` refuses unless the feature is `disabled` first — forces a cool-off period before destruction.
- `purge` auto-generates a numbered Drizzle migration in `src/db/migrations/NNNN_purge_<id>.sql` that drops the listed tables. Apply it with `npm run db:migrate`.
- `purge` also strips the matching `export * from './<schema>.schema'` lines from `src/db/schema/index.ts`.
- After `purge`, the feature status is set to `purged` and cannot be re-enabled via CLI — restore from git history if needed.

## Workflow

### Soft-hide a feature

```bash
npm run feature:disable blog
```

The blog is now invisible:

- `/blog` and `/blog/<slug>` return 404.
- `/api/v1/public/blog/*` and `/api/v1/admin/blog/*` return 404 JSON.
- The "Blog" link disappears from the public header.
- DB tables untouched — no data loss.

### Re-enable

```bash
npm run feature:enable blog
```

Everything works again. No DB migration needed because data was never dropped.

### Permanent delete

```bash
npm run feature:purge blog -- --dry-run   # review first
npm run feature:purge blog -- --yes       # do it
npm run db:migrate                         # apply the DROP TABLE migration
```

## Adding a new feature

Append an entry to `src/config/features.registry.json`:

```json
{
  "id": "my-feature",
  "label": "My Feature",
  "description": "Why it's removable.",
  "routes": ["/my-feature"],
  "apiPaths": ["/api/v1/my-feature"],
  "adminPaths": ["/admin/my-feature"],
  "navKeys": ["my-feature"],
  "adminNavHrefs": ["/admin/my-feature"],
  "workers": [],
  "schemas": ["my_feature_table"],
  "files": [
    "src/app/(public)/my-feature",
    "src/services/my-feature.service.ts",
    "src/db/schema/my-feature.schema.ts"
  ]
}
```

Field meaning:

- `routes` — public path prefixes blocked by middleware when disabled.
- `apiPaths` — API path prefixes blocked by middleware.
- `adminPaths` — admin path prefixes blocked by middleware.
- `navKeys` — keys from the public Header nav `navItems` array.
- `adminNavHrefs` — hrefs from `src/config/admin-sidebar-nav.ts` sections.
- `workers` — worker names (e.g. `"ai"`, `"social"`) registered in `src/workers/index.ts`.
- `schemas` — actual PostgreSQL table names to `DROP TABLE` on purge (not file names — table names).
- `files` — glob-free paths (files or directories) to `rm -rf` on purge.

## Current registry (34 features)

`blog`, `newsletter`, `wishlist`, `cookie-consent`, `message-center`, `help-support`, `promotion-manager`, `bulk-order`, `inventory-hub`, `logistics-ui`, `commission-rules`, `wholesale-pricing`, `api-keys`, `team-management`, `advanced-analytics`, `system-monitoring`, `notification-ui`, `product-attribute-manager`, `two-factor-auth`, `bulk-data-ops`, `media-library`, `supplier-portal`, `supplier-payouts`, `supplier-analytics`, `supplier-compliance`, `supplier-onboarding`, `extra-activity-views`, `auth-log-viewer`, `security-settings-page`, `system-integrations`, `system-logs-viewer`, `system-preferences`, `system-update-log`, `system-maintenance-mode`.

### Security & audit notes

- `extra-activity-views` — disables the `/admin/activity-logs`, `/admin/activity-timeline`, and `/admin/audit-trail` screens (all duplicate `/admin/audit-log`). Core `audit_log` table stays; `/admin/audit-log` itself is core and not flagged.
- `auth-log-viewer` — removes the `/admin/security/auth-log` viewer UI only. The `auth_security_events` table and `AuthSecurityEventService` writer stay core because the login flow depends on them.
- `security-settings-page` — removes the dedicated `/admin/security/settings` page. Use `/admin/settings` instead.

### Platform & system notes

- `system-integrations`, `system-logs-viewer`, `system-preferences`, `system-update-log`, `system-maintenance-mode` — all surface under `/admin/system/*` and share `src/services/admin/system-console.service.ts` + `src/db/schema/system-console.schema.ts`. Those shared files are intentionally NOT listed in any feature's `files` array — only purge-safe (route folders + API routes) entries are tracked. Each feature drops only the tables it owns.
- `system-preferences` also covers `/admin/system/platform-settings` (same service layer, same audience).
- `system-monitoring` (already in the registry) covers the separate `/admin/system-health-monitor`, `/admin/system-backup-recovery`, `/admin/network-performance`, and `/admin/alerts` routes — those are NOT under `/admin/system/*`.

See `npm run feature:list` for live status.

## Caveats

- **Workers use module-level instantiation.** BullMQ `Worker` instances start consuming queues the moment `ai.worker.ts` etc. are imported. The `workers/index.ts` gate only prevents `installGracefulShutdown` registration — true worker skip would need the feature check at the top of each worker file. Not an issue now since no current feature tags a worker.
- **Static/SSG pages.** If a page under a disabled feature is prerendered, middleware still intercepts the request and returns 404 — the prerender is just unused.
- **Link references in code.** Disabling a feature does not remove `<Link href="/blog">` references from other components. The links just become 404s. Clean those up at purge time (grep for the `id` before purging).
- **The `purge` migration is generated, not applied.** Run `npm run db:migrate` separately after reviewing the SQL.
