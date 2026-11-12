import "server-only";
import type { RatingSummary } from "@/features/catalog/types";
import { configured, serverClient } from "@/lib/supabase/server";
export async function getSummaries(): Promise<Record<string, RatingSummary>> {
  if (!configured()) return {};
  const db = await serverClient();
  const { data, error } = await db.rpc("rating_summaries");
  if (error) throw new Error("평점을 불러오지 못했습니다.");
  return Object.fromEntries(
    (data ?? []).map(
      (x: { drink_id: string; average: number | null; count: number }) => [
        x.drink_id,
        {
          average: x.average === null ? null : Number(x.average),
          count: Number(x.count),
        },
      ],
    ),
  );
}
