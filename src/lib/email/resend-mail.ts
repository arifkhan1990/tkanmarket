import { logger } from '@/lib/logger'

export async function sendTransactionalEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

  if (!key) {
    logger.warn('email.resend_skipped_no_api_key', { subject: params.subject })
    return { sent: false }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html
    })
  })

  if (!res.ok) {
    const text = await res.text()
    logger.error('email.resend_failed', { status: res.status, body: text })
    throw new Error('Failed to send email')
  }

  return { sent: true }
}
