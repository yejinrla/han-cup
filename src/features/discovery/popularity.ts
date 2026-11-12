import { z } from "zod";
export const popularitySchema = z.object({
  available: z.boolean(),
  items: z
    .array(
      z.object({ drinkId: z.uuid(), recorders: z.number().int().positive() }),
    )
    .max(6),
  updatedAt: z.iso.datetime(),
});
export type PopularitySnapshot = z.infer<typeof popularitySchema>;
export function unavailablePopularity(): PopularitySnapshot {
  return { available: false, items: [], updatedAt: new Date().toISOString() };
}
