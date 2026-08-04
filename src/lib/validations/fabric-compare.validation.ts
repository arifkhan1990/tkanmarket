import { z } from 'zod'

export const FabricCompareIdsSchema = z
  .string()
  .min(1)
  .transform((s) =>
    s
      .split(',')
      .map((x) => Number(String(x).trim()))
      .filter((n) => Number.isFinite(n) && Number.isInteger(n) && n > 0)
  )
  .pipe(z.array(z.number().int().positive()).min(1).max(4))

export type FabricCompareIdsInput = z.infer<typeof FabricCompareIdsSchema>
