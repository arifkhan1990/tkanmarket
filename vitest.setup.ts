import { loadEnvFile } from 'node:process'

try {
  loadEnvFile('.env')
} catch {
  // .env absent in CI — tests that need DB credentials will fail with a clear error
}