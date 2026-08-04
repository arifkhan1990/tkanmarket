# Google Gemini API Key — Setup Guide

## 1. Get the API Key

1. Go to https://aistudio.google.com/apikey
2. Sign in with any Google account (Gmail works)
3. Click **"Create API Key"**
4. Select a Google Cloud project (or create one)
5. Copy the generated key (starts with `AIza...`)

## 2. Add to `.env`

```env
GOOGLE_API_KEY=AIza...
```

Also update `.env.example` so other devs know:

```env
# Gemini AI (replaces Vertex AI — Google disabled Vertex AI service)
GOOGLE_API_KEY=
```

## 3. Verify It Works

Run this to test:

```bash
curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GOOGLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Say OK if this works"}]}]}' \
  | jq .
```

Expected response:
```json
{
  "candidates": [{
    "content": { "parts": [{ "text": "OK" }] }
  }]
}
```

## 4. Models Used in This Project

| Feature | Model | Purpose |
|---------|-------|---------|
| Text enrichment | `gemini-2.0-flash` | AI fabric data processing |
| Image generation | `gemini-2.0-flash-exp-image-generation` | Generate fabric images |
| Video generation | `gemini-2.0-flash-exp` | Generate fabric videos |

**⚠️ Image & Video models are experimental** — they are free during preview but may have rate limits.

## 5. Rate Limits (Free Tier)

| Model | Requests | Notes |
|-------|----------|-------|
| `gemini-2.0-flash` | 1,500 req/day | Text only, enough for production |
| Image models | 10 req/min | Experimental, rate limited |
| Video models | 5 req/min | Experimental, rate limited |

## 6. Environment Validation

On app startup, if `GOOGLE_API_KEY` is missing, the system throws:

```
Gemini API key not configured.
  Set GOOGLE_API_KEY in your .env file.
  Get a key at https://aistudio.google.com/apikey
```

No other Google cloud config is needed — no service account, no GCP project setup, no billing.
