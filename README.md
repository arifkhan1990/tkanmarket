# TkanMarket

B2B fabric sourcing marketplace connecting Chinese textile suppliers with
Russian/CIS buyers.

**Stack (locked):** Next.js 16 (App Router) · TypeScript strict · Tailwind +
Shadcn/UI · TanStack Query v5 · Drizzle ORM · Postgres 16 · BullMQ + Redis 7 ·
NextAuth v5 · Zod · OpenAI/Google Gemini.

## Development

```bash
npm install
npm run dev            # Next dev on :3000
npm run dev:turbo      # Turbopack dev
npm run typecheck:all  # app + workers typecheck
npm run lint
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run build` | Production build (standalone output) |
| `npm run build:workers` | Compile BullMQ workers to `dist-workers/` |
| `npm run worker:all` | Run all BullMQ workers |
| `npm run db:generate` / `db:migrate` / `db:studio` / `db:seed` | Drizzle DB tasks |
| `npm run feature:list` / `enable` / `disable` | Feature flags |

## Deployment (Google Cloud — Cloud Run)

Push to `main` → Cloud Build builds the image → auto-deploys two Cloud Run
services:

- **tkanmarket-web** — the Next.js app (`node server.js`)
- **tkanmarket-worker** — background jobs (`node dist-workers/src/workers/index.js`)

Repository is kept clean by design: **no** `.env`, docs (`.md`), AI-tool
configs (`.claude/`, `.cursor/`, `.commandcode/`, `CLAUDE.md`, `.cursorrules`),
build artifacts, or test files are tracked or shipped into the image.

### One-time GCP setup

1. **Project & APIs** — create a project, then enable:
   ```bash
   gcloud services enable run.googleapis.com \
     cloudbuild.googleapis.com artifactregistry.googleapis.com \
     secretmanager.googleapis.com sqladmin.googleapis.com redis.googleapis.com
   ```
2. **Artifact Registry** — create a Docker repo in your region:
   ```bash
   gcloud artifacts repositories create tkanmarket \
     --repository-format=docker --location=us-central1
   ```
3. **Postgres (Cloud SQL)** — create a `postgres-16` instance + database.
4. **Redis (Memorystore)** — create a Redis instance (Basic tier public IP is
   easiest; add `_VPC_CONNECTOR` in the trigger if you use private IP).
5. **Secrets** — push your local `.env` into Secret Manager (skips `NEXT_PUBLIC_*`):
   ```bash
   bash scripts/gcloud-secrets.sh .env YOUR_PROJECT_ID
   ```
   Then grant the Cloud Run runtime account `roles/secretmanager.secretAccessor`
   on those secrets (the script prints the exact command).
6. **Cloud Build trigger** — Console → Cloud Build → Triggers → *Connect
   repository* → pick this GitHub repo, branch `^main$`, config `cloudbuild.yaml`
   (inline or repo root). Set the **substitution variables**:
   - `_NEXT_PUBLIC_SITE_URL` = your public URL (e.g. `https://tkanmarket.app`)
   - `_REGION` = `us-central1` (or wherever you made the repo)
   - `_VPC_CONNECTOR` = only if using private Cloud SQL/Redis

7. (Recommended) **Initial schema + seed** — once after the DB is up:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

After that, every `git push origin main` = automatic rebuild + zero-downtime
redeploy of both services. No manual steps between deploys.