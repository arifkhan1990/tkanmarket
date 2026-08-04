/**
 * Injected at build time from package.json via next.config.js (`NEXT_PUBLIC_APP_VERSION`).
 */
export function getAppVersion(): string {
  return process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0'
}
