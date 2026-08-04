import { z } from 'zod'

const coerceArray = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (Array.isArray(value) ? value : [value]))

export const FabricQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(24),
  sort: z
    .enum(['created_at_desc', 'gsm_asc', 'price_usd_asc', 'price_usd_desc'])
    .default('created_at_desc'),
  q: z.string().trim().min(1).optional(),
  material: coerceArray.optional(),
  fabric_type: z.string().trim().min(1).max(50).optional(),
  gsm_min: z.coerce.number().int().min(0).optional(),
  gsm_max: z.coerce.number().int().min(0).optional(),
  price_usd_min: z.coerce.number().min(0).optional(),
  price_usd_max: z.coerce.number().min(0).optional(),
  // alias for clients that send a single width value (cm)
  width: z.coerce.number().int().min(0).optional(),
  width_min: z.coerce.number().int().min(0).optional(),
  width_max: z.coerce.number().int().min(0).optional(),
  moq_min: z.coerce.number().int().min(0).optional(),
  moq_max: z.coerce.number().int().min(0).optional(),
  supplier_id: z.coerce.number().int().positive().optional(),
  /** Filter by `fabric_categories.category_slug` (junction). */
  category_slug: z.string().trim().min(1).max(120).optional(),
  /** Catalog layout only; does not affect API/list query. */
  view: z.enum(['grid', 'list']).default('grid')
})

export type FabricQueryParams = z.infer<typeof FabricQuerySchema>

export const BulkFabricRowSchema = z.object({
  title_ru: z.string().trim().min(2).max(300),
  title_en: z.string().trim().max(300).optional().nullable(),
  fabric_type: z.string().trim().min(1).max(50).optional().nullable(),
  gsm: z.coerce.number().int().min(1).max(9999).optional().nullable(),
  width_cm: z.coerce.number().int().min(1).max(9999).optional().nullable(),
  price_usd: z
    .string()
    .regex(/^\d{1,8}(\.\d{1,2})?$/, 'Invalid price format')
    .optional()
    .nullable(),
  moq: z.coerce.number().int().min(1).max(999999).optional().nullable(),
  tags: z.array(z.string().trim().min(1)).max(50).optional().nullable(),
  sku: z.string().trim().max(100).optional().nullable(),
  usage_ru: z.string().trim().max(2000).optional().nullable(),
  usage_en: z.string().trim().max(2000).optional().nullable(),
  description_ru: z.string().trim().max(5000).optional().nullable(),
  color: z.string().trim().max(100).optional().nullable(),
  color_en: z.string().trim().max(100).optional().nullable(),
  supply_type: z.string().trim().max(200).optional().nullable(),
  supply_type_en: z.string().trim().max(200).optional().nullable(),
  shipment_time: z.string().trim().max(100).optional().nullable(),
  shipment_time_en: z.string().trim().max(100).optional().nullable(),
  supplier_name: z.string().trim().min(1).max(300).optional().nullable(),
  composition: z
    .array(z.object({ material: z.string(), percentage: z.number().min(1).max(100) }))
    .max(20)
    .optional()
    .nullable(),
  images: z.array(z.string().url()).max(20).optional().nullable()
})

export type BulkFabricRowInput = z.infer<typeof BulkFabricRowSchema>

export const BulkFabricCreateSchema = z.object({
  supplier_id: z.coerce.number().int().positive().optional(),
  rows: z.array(BulkFabricRowSchema).min(1).max(200)
})

export type BulkFabricCreateInput = z.infer<typeof BulkFabricCreateSchema>

// Requested export location (schema lives in lead.validation.ts to avoid duplication)
export { CreateLeadSchema } from './lead.validation'

