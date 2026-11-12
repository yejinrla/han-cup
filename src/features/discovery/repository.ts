import "server-only";
import { configured, serverClient } from "@/lib/supabase/server";
import { popularitySchema, unavailablePopularity } from "./popularity";
export async function getPopularity() {
  if (!configured()) return unavailablePopularity();
  const db = await serverClient();
  const result = await db.rpc("popular_drinks");
  if (result.error) {
    if (["PGRST202", "42883"].includes(result.error.code))
      return unavailablePopularity();
    throw new Error("인기 집계를 불러오지 못했어요.");
  }
  return popularitySchema.parse({
    available: true,
    updatedAt: new Date().toISOString(),
    items: (result.data ?? []).map(
      (r: { drink_id: string; recorders: number | string }) => ({
        drinkId: r.drink_id,
        recorders: Number(r.recorders),
      }),
    ),
  });
}
