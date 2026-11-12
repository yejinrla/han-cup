import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { searchStores, validateStoreInput } from "@/features/stores/search";
import { adminClient } from "@/lib/supabase/admin";
export async function POST(request: Request) {
  let input;
  try {
    const body = await request.json();
    input = validateStoreInput(body);
  } catch {
    return NextResponse.json(
      { error: "브랜드·지역·위치 정보를 확인해 주세요." },
      { status: 400 },
    );
  }
  if (!process.env.KAKAO_REST_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json(
      {
        error:
          "매장 검색 연결을 준비하고 있어요. 카카오맵에서 가까운 매장을 찾아보세요.",
      },
      { status: 503 },
    );
  try {
    const db = adminClient();
    const client = createHash("sha256")
      .update(
        (request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown") +
          new Date().toISOString().slice(0, 10),
      )
      .digest("hex");
    const { data: allowed, error } = await db.rpc("reserve_map_request", {
      client,
      daily_limit: Number(process.env.KAKAO_DAILY_SEARCH_BUDGET ?? 1000),
    });
    if (error || !allowed)
      return NextResponse.json(
        {
          error:
            "오늘의 무료 검색 한도에 도달했어요. 카카오맵에서 이어서 찾아보세요.",
        },
        { status: 429 },
      );
    const result = await searchStores(input);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "매장 검색을 잠시 이용할 수 없어요. 카카오맵에서 이어서 찾아보세요.",
      },
      { status: 503 },
    );
  }
}
