import type { Client } from "pg";
import { validateCatalog, type ApprovedCatalogBatch } from "./schema";
export async function publishCatalog(input: ApprovedCatalogBatch, db: Client) {
  const result = validateCatalog(input);
  if (!result.ok) throw new Error(result.errors.join("\n"));
  const batch = result.batch;
  await db.query("begin");
  try {
    const release = await db.query(
      "insert into catalog_releases(reviewer) values($1) returning id",
      [batch.reviewer],
    );
    const releaseId = release.rows[0].id as string;
    for (const c of batch.changes) {
      await db.query("select pg_advisory_xact_lock(hashtext($1))", [c.id]);
      const old = await db.query(
        "select * from drinks where id=$1 for update",
        [c.id],
      );
      if ((old.rows[0]?.revision ?? 0) !== c.expectedRevision)
        throw new Error("검수 이후 데이터 변경: 다시 검수하세요.");
      const variants = await db.query(
        "select * from drink_variants where drink_id=$1",
        [c.id],
      );
      await db.query("insert into catalog_release_items values($1,$2,$3)", [
        releaseId,
        c.id,
        JSON.stringify({ drink: old.rows[0] ?? null, variants: variants.rows }),
      ]);
      await db.query(
        `insert into drinks(id,brand_id,slug,name,category,status,default_variant_id,revision) values($1,$2,$3,$4,$5,$6,null,1) on conflict(id) do update set name=excluded.name,category=excluded.category,status=excluded.status,revision=drinks.revision+1`,
        [c.id, c.brandId, c.slug, c.name, c.category, c.status],
      );
      for (const v of c.variants)
        await db.query(
          `insert into drink_variants(id,drink_id,temperature,size_label,cup_ml,nutrition_basis_ml,calories_kcal,sugar_g,caffeine_mg,price_krw,source_url,checked_at,image_path,price_source_url,image_source_url,image_permission,extra_nutrition) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) on conflict(id) do update set calories_kcal=excluded.calories_kcal,sugar_g=excluded.sugar_g,caffeine_mg=excluded.caffeine_mg,cup_ml=excluded.cup_ml,nutrition_basis_ml=excluded.nutrition_basis_ml,price_krw=excluded.price_krw,source_url=excluded.source_url,checked_at=excluded.checked_at,image_path=excluded.image_path,price_source_url=excluded.price_source_url,image_source_url=excluded.image_source_url,image_permission=excluded.image_permission,extra_nutrition=excluded.extra_nutrition`,
          [
            v.id,
            c.id,
            v.temperature,
            v.sizeLabel,
            v.cupMl,
            v.nutritionBasisMl,
            v.nutrition.caloriesKcal,
            v.nutrition.sugarG,
            v.nutrition.caffeineMg,
            v.priceKrw,
            v.source.url,
            v.source.checkedAt,
            v.imagePath,
            v.priceSourceUrl ?? null,
            v.imageSourceUrl ?? null,
            v.imagePermission ?? null,
            v.extraNutrition ?? {},
          ],
        );
      await db.query("update drinks set default_variant_id=$2 where id=$1", [
        c.id,
        c.defaultVariantId,
      ]);
    }
    await db.query("commit");
    return { releaseId };
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}
