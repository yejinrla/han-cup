import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogData } from "@/features/catalog/types";
import { monthRange } from "./calendar";

export async function loadJournalData(
  db: SupabaseClient,
  userId: string,
  selectedDate: string,
  offset: number,
  loadCatalog: () => Promise<CatalogData>,
) {
  async function dayReviews() {
    const result = await db
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .eq("consumed_on", selectedDate)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + 20);
    if (result.error) throw new Error("기록을 불러오지 못했어요.");
    return result.data ?? [];
  }
  async function monthRecords() {
    const { start, end } = monthRange(selectedDate);
    const dates: string[] = [];
    // PostgREST caps each response; retain all dates even in a busy month.
    for (let from = 0; ; from += 500) {
      const result = await db
        .from("reviews")
        .select("consumed_on")
        .eq("user_id", userId)
        .gte("consumed_on", start)
        .lte("consumed_on", end)
        .order("id", { ascending: true })
        .range(from, from + 499);
      if (result.error) throw new Error("달력 기록을 불러오지 못했어요.");
      dates.push(...(result.data ?? []).map((r) => r.consumed_on));
      if (!result.data || result.data.length < 500) return dates;
    }
  }
  const [catalog, rows, recordDates] = await Promise.all([
    loadCatalog(),
    dayReviews(),
    monthRecords(),
  ]);
  return { catalog, rows, recordDates };
}
