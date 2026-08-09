#!/usr/bin/env bash
# ============================================================================
# scripts/gcloud-secrets.sh
#
# Creates/updates all Secret Manager secrets for TkanMarket from a local env
# file. Run once during GCP setup — the .env stays on your machine and never
# enters git or the container build.
#
# Usage:
#   bash scripts/gcloud-secrets.sh [path-to-.env] [project-id]
#     e.g. bash scripts/gcloud-secrets.sh .env my-project
#
# Skips NEXT_PUBLIC_* vars (those are build-time and configured as Cloud Build
# substitutions instead) and empty values.
# ============================================================================
set -euo pipefail

ENV_FILE="${1:-.env}"
PROJECT="${2:-$PROJECT_ID}"
[ -n "$PROJECT" ] || { echo "ERROR: pass the GCP project id as arg 2 (or set PROJECT_ID)."; exit 1; }
[ -f "$ENV_FILE" ] || { echo "ERROR: env file '$ENV_FILE' not found."; exit 1; }

# Which vars must exist at runtime (everything server-side, non-public).
CRITICAL=(
  DATABASE_URL REDIS_URL GOOGLE_API_KEY NEXTAUTH_SECRET
  SOCIAL_TOKEN_ENCRYPTION_KEY
  CLOUDFLARE_R2_ACCOUNT_ID CLOUDFLARE_R2_ACCESS_KEY_ID CLOUDFLARE_R2_SECRET_ACCESS_KEY
  CLOUDFLARE_R2_BUCKET CLOUDFLARE_R2_PUBLIC_BASE_URL
)

created=0
while IFS='=' read -r key val; do
  key="${key#"${key%%[![:space:]]*}"}"
  [ -z "$key" ] && continue
  case "$key" in \#*) continue ;; esac
  case "$key" in NEXT_PUBLIC_*) continue ;; esac
  [ -z "$val" ] && continue

  # Strip surrounding single/double quotes from the value so secrets are stored
  # verbatim (dotenv quotes must not be part of the runtime value).
  val="${val#\"}"
  val="${val%\"}"
  val="${val#\'}"
  val="${val%\'}"
  [ -z "$val" ] && continue

  # Normalize secret name: UPPER_SNAKE -> lower_snake
  secret="${key,,}"
  # gcloud secrets create requires a name; reuse if already present.
  if gcloud secrets describe "$secret" --project="$PROJECT" >/dev/null 2>&1; then
    printf '%s' "$val" | gcloud secrets versions add "$secret" --data-file=- --project="$PROJECT" >/dev/null
  else
    printf '%s' "$val" | gcloud secrets create "$secret" --data-file=- --project="$PROJECT" >/dev/null
  fi
  created=$((created+1))
done < <(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$ENV_FILE")

echo "Synced $created secrets into project '$PROJECT'."
echo
echo "Grant the Cloud Run runtime service account access:"
echo "  gcloud projects add-iam-policy-binding $PROJECT \
  --member='serviceAccount:SERVICE_ACCOUNT_EMAIL' \
  --role='roles/secretmanager.secretAccessor'"
echo "(For default compute SA: PROJECT_NUMBER-compute@developer.gserviceaccount.com)"