import { NextResponse } from "next/server";
import { z } from "zod";
import { configured, serverClient } from "@/lib/supabase/server";
import { getSummaries } from "@/features/reviews/repository";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return NextResponse.json(
      { error: "음료를 확인해 주세요." },
      { status: 400 },
    );
  const value = new URL(request.url).searchParams.get("offset") ?? "0";
  const offset = /^\d+$/.test(value) ? Math.min(Number(value), 10000) : 0;
  if (!configured())
    return NextResponse.json(
      { items: [], summary: { average: null, count: 0 } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  try {
    const db = await serverClient();
    const [result, summaries] = await Promise.all([
      db.rpc("public_reviews", { product: id, offset_rows: offset }),
      getSummaries(),
    ]);
    if (result.error) throw result.error;
    return NextResponse.json(
      {
        items: result.data ?? [],
        summary: summaries[id] ?? { average: null, count: 0 },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "공개 후기를 불러오지 못했어요." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
