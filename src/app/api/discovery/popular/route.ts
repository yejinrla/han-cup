import { NextResponse } from "next/server";
import { getPopularity } from "@/features/discovery/repository";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await getPopularity(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "인기 집계를 갱신하지 못했어요." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
