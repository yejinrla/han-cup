import type { Client } from "pg";
export async function rollbackCatalog(releaseId: string, db: Client) {
  await db.query("begin");
  try {
    const release = await db.query(
      "select * from catalog_releases where id=$1 and not reverted for update",
      [releaseId],
    );
    if (!release.rowCount) throw new Error("복구 가능한 발행이 아닙니다.");
    const rows = await db.query(
      "select * from catalog_release_items where release_id=$1",
      [releaseId],
    );
    for (const row of rows.rows) {
      const current = await db.query(
        "select revision from drinks where id=$1 for update",
        [row.drink_id],
      );
      const previous = row.previous.drink;
      if (!previous)
        throw new Error("신규 제품은 삭제 대신 판매 종료로 별도 검수하세요.");
      if (current.rows[0]?.revision !== previous.revision + 1)
        throw new Error("이후 발행이 있어 바로 복구할 수 없습니다.");
      await db.query(
        "update drinks set name=$2,category=$3,status=$4,default_variant_id=$5,revision=revision+1 where id=$1",
        [
          row.drink_id,
          previous.name,
          previous.category,
          previous.status,
          previous.default_variant_id,
        ],
      );
      for (const v of row.previous.variants) {
        const cols = Object.keys(v).filter(
          (k) => k !== "id" && k !== "drink_id",
        );
        await db.query(
          `update drink_variants set ${cols.map((k, i) => `"${k}"=$${i + 2}`).join(",")} where id=$1`,
          [v.id, ...cols.map((k) => v[k])],
        );
      }
    }
    await db.query("update catalog_releases set reverted=true where id=$1", [
      releaseId,
    ]);
    await db.query("commit");
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}
