import { z } from 'zod'
import { LeadSource, LeadStatus } from '@/types/enums'
import { CIS_COUNTRIES } from '@/constants'

// ============================================================
// Create lead (public form submission)
// ============================================================
export const CreateLeadSchema = z.object({
  source:       z.nativeEnum(LeadSource),
  company_name: z.string().min(1, 'Введите название компании').max(200),
  contact_name: z.string().min(1, 'Введите ваше имя').max(200),
  email:        z.string().email('Введите корректный email'),
  phone:        z.string().max(30).optional(),
  country:      z.string().min(1, 'Выберите страну').max(100),
  city:         z.string().max(100).optional(),
  fabric_id:    z.number().int().positive().optional(),
  inquiry_text: z.string().min(5, 'Опишите ваш запрос').max(2000),
  utm_source:   z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_medium:   z.string().max(100).optional(),
})

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>

// ============================================================
// Update lead status (admin)
// ============================================================
export const UpdateLeadStatusSchema = z.object({
  action: z.literal('update_status'),
  status: z.nativeEnum(LeadStatus),
})

// ============================================================
// Add note to lead (admin)
// ============================================================
export const AddLeadNoteSchema = z.object({
  action:  z.literal('add_note'),
  content: z.string().min(1).max(2000),
})

// ============================================================
// Assign lead to sales rep (admin)
// ============================================================
export const AssignLeadSchema = z.object({
  action:  z.literal('assign'),
  user_id: z.number().int().positive(),
})

// ============================================================
// Combined lead update action
// ============================================================
export const LeadActionSchema = z.discriminatedUnion('action', [
  UpdateLeadStatusSchema,
  AddLeadNoteSchema,
  AssignLeadSchema,
])

export type LeadActionInput = z.infer<typeof LeadActionSchema>

// ============================================================
// Admin lead list filters
// ============================================================
export const AdminLeadQuerySchema = z.object({
  page:        z.coerce.number().min(1).default(1),
  limit:       z.coerce.number().min(1).max(100).default(50),
  status:      z.nativeEnum(LeadStatus).optional(),
  source:      z.nativeEnum(LeadSource).optional(),
  assigned_to: z.coerce.number().int().positive().optional(),
  country:     z.string().optional(),
  date_from:   z.string().datetime().optional(),
  date_to:     z.string().datetime().optional(),
  q:           z.string().max(200).optional(),
  view:        z.enum(['table', 'kanban']).default('table'),
})

export type AdminLeadQueryInput = z.infer<typeof AdminLeadQuerySchema>
