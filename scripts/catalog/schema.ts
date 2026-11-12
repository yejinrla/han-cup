import { z } from "zod";
const official = [
  "starbucks.co.kr",
  "twosome.co.kr",
  "ediya.com",
  "mega-mgccoffee.com",
  "composecoffee.com",
  "paikdabang.com",
];
const source = z.object({
  url: z.url().refine((s) => {
    const u = new URL(s);
    return (
      u.protocol === "https:" &&
      official.some((d) => u.hostname === d || u.hostname.endsWith("." + d))
    );
  }),
  checkedAt: z.iso.date(),
});
const value = z.number().finite().nonnegative().nullable();
const variant = z
  .object({
    id: z.uuid(),
    temperature: z.enum(["hot", "iced", "ambient"]),
    sizeLabel: z.string().min(1),
    cupMl: z.number().positive().nullable(),
    nutritionBasisMl: z.number().positive().nullable(),
    nutrition: z.object({
      caloriesKcal: value,
      sugarG: value,
      caffeineMg: value,
    }),
    priceKrw: z.number().int().nonnegative().nullable(),
    source,
    priceSourceUrl: z.url().nullable().optional(),
    imagePath: z
      .string()
      .regex(/^\/images\/drinks\/[a-z0-9._-]+$/)
      .nullable(),
    imageSourceUrl: z.url().optional(),
    imagePermission: z.string().optional(),
    extraNutrition: z
      .record(z.string(), z.union([z.string(), z.number()]))
      .optional(),
  })
  .refine(
    (v) => !v.imagePath || (v.imageSourceUrl && v.imagePermission),
    "사진 사용 근거 필요",
  );
const change = z
  .object({
    id: z.uuid(),
    expectedRevision: z.number().int().nonnegative(),
    brandId: z.enum([
      "starbucks",
      "twosome",
      "ediya",
      "mega",
      "compose",
      "paik",
    ]),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    category: z.enum(["coffee", "tea", "ade", "smoothie", "other"]),
    status: z.enum(["active", "discontinued"]),
    defaultVariantId: z.uuid(),
    variants: z.array(variant).min(1),
  })
  .superRefine((c, ctx) => {
    if (!c.variants.some((v) => v.id === c.defaultVariantId))
      ctx.addIssue({ code: "custom", message: "기본 변형 누락" });
    if (
      new Set(c.variants.map((v) => v.id)).size !== c.variants.length ||
      new Set(c.variants.map((v) => v.temperature + v.sizeLabel)).size !==
        c.variants.length
    )
      ctx.addIssue({ code: "custom", message: "중복 변형" });
  });
export const batchSchema = z
  .object({
    schemaVersion: z.literal(1),
    reviewer: z.string().min(1),
    reviewedAt: z.iso.date(),
    changes: z.array(change).min(1),
  })
  .refine(
    (b) => new Set(b.changes.map((c) => c.id)).size === b.changes.length,
    "제품 ID 중복",
  )
  .refine((b) => {
    const ids = b.changes.flatMap((c) => c.variants.map((v) => v.id));
    return new Set(ids).size === ids.length;
  }, "전체 검수 묶음에 변형 ID 중복");
export type ApprovedCatalogBatch = z.infer<typeof batchSchema>;
export function validateCatalog(input: unknown) {
  const r = batchSchema.safeParse(input);
  return r.success
    ? { ok: true as const, batch: r.data }
    : {
        ok: false as const,
        errors: r.error.issues.map((i) => i.path.join(".") + ": " + i.message),
      };
}
