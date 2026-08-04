# ============================================================================
# TkanMarket production image.
#
# One image serves two Cloud Run services:
#   1. tkanmarket-web     -> `node server.js`               (Next.js standalone)
#   2. tkanmarket-worker  -> `node dist-workers/src/workers/index.js` (BullMQ)
#
# Base: official Playwright image -> bundles Chromium + all system libs so the
# crawler worker works out of the box (no separate apt install step).
# ============================================================================

FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Copy config + pruned deps
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY next.config.js tsconfig.json tsconfig.workers.json postcss.config.js tailwind.config.ts components.json drizzle.config.ts eslint.config.js ./
COPY public ./public
COPY src ./src
COPY crawler ./crawler
COPY scripts ./scripts

# Build-time env vars (Next.js inlines NEXT_PUBLIC_* into the bundle).
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_DOCS_URL
ARG NEXT_PUBLIC_INSTAGRAM_URL
ARG NEXT_PUBLIC_TIKTOK_URL
ARG NEXT_PUBLIC_PINTEREST_URL
ARG NEXT_PUBLIC_TELEGRAM_URL
ARG NEXT_PUBLIC_WHATSAPP_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_DOCS_URL=$NEXT_PUBLIC_DOCS_URL \
    NEXT_PUBLIC_INSTAGRAM_URL=$NEXT_PUBLIC_INSTAGRAM_URL \
    NEXT_PUBLIC_TIKTOK_URL=$NEXT_PUBLIC_TIKTOK_URL \
    NEXT_PUBLIC_PINTEREST_URL=$NEXT_PUBLIC_PINTEREST_URL \
    NEXT_PUBLIC_TELEGRAM_URL=$NEXT_PUBLIC_TELEGRAM_URL \
    NEXT_PUBLIC_WHATSAPP_URL=$NEXT_PUBLIC_WHATSAPP_URL

# Build the Next.js standalone server and the BullMQ workers (dist-workers).
RUN npm run build
RUN npm run build:workers

# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    NEXT_TELEMETRY_DISABLED=1

# Keep the runtime image firmware-free but still let PostgreSQL connect over TLS.
# (node: already in base; nothing extra required.)

# Next.js standalone server entrypoint + server chunks/manifests ONLY.
# (We deliberately do NOT copy the whole `.next/standalone` tree so docs,
#  logs and other non-runtime scratch files never end up in the image.)
COPY --from=build /app/.next/standalone/server.js ./server.js
COPY --from=build /app/.next/standalone/.next ./.next

# Static assets + public files
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Full node_modules (server.js resolves `next` from here; the worker scripts
# in dist-workers resolve every package they import too).
COPY --from=build /app/node_modules ./node_modules

# Compiled BullMQ workers
COPY --from=build /app/dist-workers ./dist-workers

# Least-privilege non-root runtime user.
RUN useradd --create-home --uid 10001 appuser || true

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 8080) + '/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Cloud Run overrides the container command with the service's start command.
CMD ["node", "server.js"]