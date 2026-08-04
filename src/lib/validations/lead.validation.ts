import { z } from 'zod'

export const LeadSourceSchema = z.enum([
  'MARKETPLACE_INQUIRY',
  'SAMPLE_REQUEST',
  'SOCIAL_CAMPAIGN',
  'DIRECT_CONTACT',
  'MANUAL_ENTRY'
])

export const CreateLeadSchema = z.object({
  source: LeadSourceSchema,
  company_name: z.string().trim().min(1),
  contact_name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1),
  city: z.string().trim().min(1).optional(),
  fabric_id: z.coerce.number().int().positive().optional(),
  inquiry_text: z.string().trim().min(1),
  utm_source: z.string().trim().optional(),
  utm_campaign: z.string().trim().optional()
})

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>

export const LeadStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'CLOSED_WON',
  'CLOSED_LOST'
])

export const UpdateLeadSchema = z
  .object({
    status: LeadStatusSchema.optional(),
    assigned_to_id: z.coerce.number().int().positive().nullable().optional(),
    company_name: z.string().trim().min(1).optional(),
    contact_name: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(1).nullable().optional(),
    country: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).nullable().optional(),
    fabric_id: z.coerce.number().int().positive().nullable().optional(),
    inquiry_text: z.string().trim().min(1).optional(),
    utm_source: z.string().trim().nullable().optional(),
    utm_campaign: z.string().trim().nullable().optional(),
    utm_medium: z.string().trim().nullable().optional()
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one field is required' })

export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>

