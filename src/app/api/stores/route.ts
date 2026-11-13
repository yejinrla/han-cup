import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import {
  KakaoLocalError,
  searchStores,
  validateStoreInput,
} from "@/features/stores/search";
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
  let stage: "budget" | "kakao" = "budget";
  try {
    const db = adminClient();
    const client = createHash("sha256")
      .update(
        (request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown") +
          new Date().toISOString().slice(0, 10),
      )
      .digest("hex");
    const {
      data: allowed,
      error,
      status: budgetStatus,
    } = await db.rpc("reserve_map_request", {
      client,
      daily_limit: Number(process.env.KAKAO_DAILY_SEARCH_BUDGET ?? 1000),
    });
    if (error || typeof allowed !== "boolean") {
      const code = ["PGRST202", "42883", "42P01"].includes(error?.code ?? "")
        ? "STORE_SEARCH_SETUP_REQUIRED"
        : error?.code === "42501"
          ? "STORE_SEARCH_PERMISSION_DENIED"
          : budgetStatus === 401 ||
              budgetStatus === 403 ||
              ["PGRST301", "PGRST302"].includes(error?.code ?? "")
            ? "STORE_SEARCH_AUTH_FAILED"
            : "STORE_SEARCH_BUDGET_UNAVAILABLE";
      return NextResponse.json(
        {
          error:
            "매장 검색 연결을 확인하고 있어요. 잠시 후 다시 시도하거나 카카오맵에서 찾아보세요.",
          code,
        },
        { status: 503 },
      );
    }
    if (!allowed)
      return NextResponse.json(
        {
          error:
            "오늘의 무료 검색 한도에 도달했어요. 카카오맵에서 이어서 찾아보세요.",
        },
        { status: 429 },
      );
    stage = "kakao";
    const result = await searchStores(input);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const providerCodes: Record<number, string> = {
      401: "KAKAO_LOCAL_AUTH_FAILED",
      403: "KAKAO_LOCAL_ACCESS_DENIED",
      429: "KAKAO_LOCAL_THROTTLED",
    };
    const code =
      stage === "budget"
        ? "STORE_SEARCH_BUDGET_UNAVAILABLE"
        : error instanceof KakaoLocalError
          ? (providerCodes[error.status] ?? "KAKAO_LOCAL_UNAVAILABLE")
          : "KAKAO_LOCAL_UNAVAILABLE";
    return NextResponse.json(
      {
        error:
          "매장 검색을 잠시 이용할 수 없어요. 카카오맵에서 이어서 찾아보세요.",
        code,
      },
      { status: 503 },
    );
  }
}
