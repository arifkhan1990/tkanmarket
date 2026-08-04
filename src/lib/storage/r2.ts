import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

import { logger } from '@/lib/logger'

let client: S3Client | null = null
let bucket: string | null = null
let publicBaseUrl: string | null = null

function getR2Client(): { client: S3Client; bucket: string; publicBaseUrl: string } {
  if (client && bucket && publicBaseUrl) return { client, bucket, publicBaseUrl }

  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  const b = process.env.CLOUDFLARE_R2_BUCKET
  const baseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL

  if (!accountId || !accessKeyId || !secretAccessKey || !b) {
    throw new Error('Cloudflare R2 not configured')
  }

  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  })

  bucket = b
  publicBaseUrl = baseUrl ?? `https://${b}.r2.dev`

  return { client, bucket, publicBaseUrl }
}

export function getS3Client(): S3Client {
  return getR2Client().client
}

export function getBucket(): string {
  return getR2Client().bucket
}

export function getPublicBaseUrl(): string {
  return getR2Client().publicBaseUrl
}

/**
 * Resolves a stored R2 key (e.g. `/fabrics/32/generated/134.png`) to a full public URL.
 * No-op if the URL is already absolute or doesn't start with `/fabrics/`.
 */
export function resolveR2Url(url: string | null): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed
  }
  const r2Prefix = '/fabrics/'
  if (trimmed.startsWith(r2Prefix)) {
    const baseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL ?? `https://r2.dev`
    return `${baseUrl.replace(/\/+$/, '')}${trimmed}`
  }
  return trimmed
}

export async function uploadBuffer(
  buffer: Buffer,
  key: string,
  contentType: string = 'video/mp4'
): Promise<string> {
  const { client: s3, bucket: b, publicBaseUrl: base } = getR2Client()
  await s3.send(
    new PutObjectCommand({
      Bucket: b,
      Key: key,
      Body: buffer,
      ContentType: contentType
    })
  )
  const publicUrl = `${base}/${key}`
  logger.info('Uploaded buffer to R2', { key, publicUrl })
  return publicUrl
}

export async function uploadFromUrl(sourceUrl: string, key: string): Promise<string> {
  const { client: s3, bucket: b, publicBaseUrl: base } = getR2Client()

  const response = await fetch(sourceUrl)
  if (!response.ok) throw new Error(`Failed to fetch source URL: ${response.status} ${response.statusText}`)

  const body = await response.arrayBuffer()

  await s3.send(
    new PutObjectCommand({
      Bucket: b,
      Key: key,
      Body: new Uint8Array(body),
      ContentType: response.headers.get('content-type') ?? 'image/png'
    })
  )

  const publicUrl = `${base}/${key}`
  logger.info('Uploaded to R2', { key, sourceUrl, publicUrl })
  return publicUrl
}
