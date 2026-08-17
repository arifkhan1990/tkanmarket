import { z } from 'zod'

import { ALL_COUNTRIES } from '@/constants'

export const SampleRequestFormSchema = z.object({
  contact_name: z.string().trim().min(1),
  email: z.string().trim().email(),
  company_name: z.string().trim().min(1),
  tax_id: z.string().trim().optional(),
  country: z.enum(ALL_COUNTRIES),
  city: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  shipping_notes: z.string().trim().optional()
})

export type SampleRequestFormValues = z.infer<typeof SampleRequestFormSchema>

export function buildSampleRequestInquiryText(
  values: SampleRequestFormValues,
  opts: { fabricTitle: string | null; fabricSku: string | null; fabricId: number | null }
): string {
  const lines: string[] = [
    'Sample request (dedicated page).',
    `Company: ${values.company_name}`,
    `Contact: ${values.contact_name}`,
    `Email: ${values.email}`
  ]
  if (values.tax_id) lines.push(`Tax / VAT ID: ${values.tax_id}`)
  lines.push(`Country: ${values.country}`)
  if (values.city) lines.push(`City: ${values.city}`)
  if (values.phone) lines.push(`Phone: ${values.phone}`)
  if (values.shipping_notes) lines.push(`Shipping / delivery notes: ${values.shipping_notes}`)

  if (opts.fabricId) {
    lines.push(`Requested fabric ID: ${opts.fabricId}`)
    if (opts.fabricSku) lines.push(`SKU: ${opts.fabricSku}`)
    if (opts.fabricTitle) lines.push(`Fabric: ${opts.fabricTitle}`)
  } else {
    lines.push('Requested fabric: general sample inquiry (no specific fabric linked).')
  }

  return lines.join('\n')
}
