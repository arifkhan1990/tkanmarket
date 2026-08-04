import { z } from 'zod'

export const ShippingRateDestinationSchema = z.enum(['EU', 'NA', 'SEA', 'MENA'])

export const ShippingRateCalculateBodySchema = z.object({
  gsm: z.coerce.number().positive().max(2000),
  roll_diameter_cm: z.coerce.number().positive().max(500),
  roll_width_cm: z.coerce.number().positive().max(400),
  /** Assumed fabric length on one roll for weight (meters). */
  roll_length_m: z.coerce.number().positive().max(500).optional().default(50),
  destination: ShippingRateDestinationSchema,
  fuel_surcharge_enabled: z.boolean().optional().default(true)
})

export type ShippingRateCalculateInput = z.infer<typeof ShippingRateCalculateBodySchema>
