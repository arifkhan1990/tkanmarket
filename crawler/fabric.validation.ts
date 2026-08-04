import { z } from 'zod'
import { FabricStatus, FabricType } from '@/types/enums'

// ============================================================
// Fabric list query params (public catalog)
// ============================================================
export const FabricQuerySchema = z.object({
  page:        z.coerce.number().min(1).default(1),
  limit:       z.coerce.number().min(1).max(100).default(24),
  sort:        z.enum(['created_at', 'price_usd', 'gsm', 'views_count']).default('created_at'),
  order:       z.enum(['asc', 'desc']).default('desc'),
  q:           z.string().max(200).optional(),
  material:    z.union([z.string(), z.array(z.string())]).optional().transform(v =>
                 v ? (Array.isArray(v) ? v : [v]) : undefined),
  fabric_type: z.nativeEnum(FabricType).optional(),
  gsm_min:     z.coerce.number().min(0).max(2000).optional(),
  gsm_max:     z.coerce.number().min(0).max(2000).optional(),
  width_min:   z.coerce.number().min(0).optional(),
  width_max:   z.coerce.number().min(0).optional(),
  moq_max:     z.coerce.number().min(0).optional(),
  price_max:   z.coerce.number().min(0).optional(),
  supplier_id: z.coerce.number().int().positive().optional(),
  featured:    z.coerce.boolean().optional(),
})

export type FabricQueryInput = z.infer<typeof FabricQuerySchema>

// ============================================================
// Admin fabric list query (includes all statuses)
// ============================================================
export const AdminFabricQuerySchema = FabricQuerySchema.extend({
  status:      z.nativeEnum(FabricStatus).optional(),
  limit:       z.coerce.number().min(1).max(100).default(50),
})

export type AdminFabricQueryInput = z.infer<typeof AdminFabricQuerySchema>

// ============================================================
// Fabric update (admin edit)
// ============================================================
export const UpdateFabricSchema = z.object({
  title_ru:        z.string().min(1).max(300).optional(),
  title_en:        z.string().max(300).optional(),
  description_ru:  z.string().max(5000).optional(),
  description_en:  z.string().max(5000).optional(),
  meta_title_ru:   z.string().max(60).optional(),
  meta_desc_ru:    z.string().max(155).optional(),
  fabric_type:     z.nativeEnum(FabricType).optional(),
  gsm:             z.number().int().min(0).max(2000).nullable().optional(),
  width_cm:        z.number().int().min(0).max(500).nullable().optional(),
  price_usd:       z.number().min(0).nullable().optional(),
  moq:             z.number().int().min(0).nullable().optional(),
  composition:     z.array(z.object({
    material:   z.string().min(1),
    percentage: z.number().min(0).max(100),
  })).optional(),
  tags:            z.array(z.string()).optional(),
  is_featured:     z.boolean().optional(),
})

export type UpdateFabricInput = z.infer<typeof UpdateFabricSchema>

// ============================================================
// Fabric status update (approve / reject)
// ============================================================
export const UpdateFabricStatusSchema = z.object({
  status:         z.nativeEnum(FabricStatus),
  rejection_reason: z.string().max(500).optional(),
})

export type UpdateFabricStatusInput = z.infer<typeof UpdateFabricStatusSchema>
