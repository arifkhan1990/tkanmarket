import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

/**
 * AES-256-GCM envelope encryption for social platform OAuth tokens.
 *
 * Ciphertext layout (base64url-encoded):
 *   [ 1 byte version | 12 bytes IV | 16 bytes auth tag | N bytes ciphertext ]
 *
 * Key source: `SOCIAL_TOKEN_ENCRYPTION_KEY` env var. Accepts either 32 raw bytes
 * (hex or base64) or any other string which is hashed with SHA-256 to derive a
 * 32-byte key. Missing key throws at first use, never silently falls back.
 */

const VERSION = 0x01
const IV_LENGTH = 12
const TAG_LENGTH = 16
const KEY_LENGTH = 32

let cachedKey: Buffer | null = null

function decodeHexOrBase64(source: string): Buffer | null {
  const trimmed = source.trim()
  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length === KEY_LENGTH * 2) {
    return Buffer.from(trimmed, 'hex')
  }
  try {
    const decoded = Buffer.from(trimmed, 'base64')
    if (decoded.length === KEY_LENGTH) return decoded
  } catch {
    // ignore and fall through to SHA-256 derivation
  }
  return null
}

function loadKey(): Buffer {
  if (cachedKey) return cachedKey
  const raw = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY
  if (!raw || raw.length === 0) {
    throw new Error('SOCIAL_TOKEN_ENCRYPTION_KEY is not configured')
  }
  const decoded = decodeHexOrBase64(raw)
  cachedKey = decoded ?? createHash('sha256').update(raw, 'utf8').digest()
  return cachedKey
}

function toBase64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): Buffer {
  const padLength = (4 - (value.length % 4)) % 4
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLength)
  return Buffer.from(padded, 'base64')
}

export function encryptToken(plaintext: string): string {
  if (typeof plaintext !== 'string' || plaintext.length === 0) {
    throw new Error('encryptToken: plaintext must be a non-empty string')
  }
  const key = loadKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return toBase64Url(Buffer.concat([Buffer.from([VERSION]), iv, tag, ciphertext]))
}

export function decryptToken(ciphertext: string): string {
  if (typeof ciphertext !== 'string' || ciphertext.length === 0) {
    throw new Error('decryptToken: ciphertext must be a non-empty string')
  }
  const key = loadKey()
  const data = fromBase64Url(ciphertext)
  if (data.length < 1 + IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error('decryptToken: payload too short')
  }
  const version = data.readUInt8(0)
  if (version !== VERSION) {
    throw new Error(`decryptToken: unsupported version ${version}`)
  }
  const iv = data.subarray(1, 1 + IV_LENGTH)
  const tag = data.subarray(1 + IV_LENGTH, 1 + IV_LENGTH + TAG_LENGTH)
  const body = data.subarray(1 + IV_LENGTH + TAG_LENGTH)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(body), decipher.final()])
  return plaintext.toString('utf8')
}

export function encryptTokenNullable(value: string | null | undefined): string | null {
  if (!value) return null
  return encryptToken(value)
}

export function decryptTokenNullable(value: string | null | undefined): string | null {
  if (!value) return null
  return decryptToken(value)
}
