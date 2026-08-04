import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'

const PBKDF2_ITERATIONS = 210_000
const KEYLEN = 32
const DIGEST = 'sha256'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEYLEN, DIGEST).toString('hex')
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${derivedKey}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 4) return false
  const algo = parts[0] ?? ''
  const iterRaw = parts[1] ?? ''
  const salt = parts[2] ?? ''
  const hash = parts[3] ?? ''
  if (algo !== 'pbkdf2') return false
  const iterations = Number(iterRaw)
  if (!Number.isFinite(iterations) || iterations < 100_000) return false

  const derivedKey = pbkdf2Sync(password, salt, iterations, KEYLEN, DIGEST)
  const expected = Buffer.from(hash, 'hex')
  if (expected.length !== derivedKey.length) return false
  return timingSafeEqual(expected, derivedKey)
}

