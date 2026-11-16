import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { configured, serverClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getCatalog } from "@/features/catalog/repository";
import { eligibleSearchTerm } from "@/features/search/discovery";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const missing = (code?: string) =>
  ["PGRST202", "42883", "42P01"].includes(code ?? "");
export async function GET() {
  const empty = { available: false, items: [], updatedAt: null };
  if (!configured()) return NextResponse.json(empty, { headers });
  try {
    const db = await serverClient();
    const { data, error } = await db.rpc("rising_search_terms");
    if (error) {
      if (missing(error.code)) return NextResponse.json(empty, { headers });
      throw error;
    }
    const schema = z
      .array(
        z.object({
          term: z.string().min(1).max(100),
          recent: z.coerce.number().int().min(3),
          previous: z.coerce.number().int().nonnegative(),
          growth: z.coerce.number().int().positive(),
        }),
      )
      .max(5);
    return NextResponse.json(
      {
        available: true,
        items: schema.parse(data ?? []),
        updatedAt: new Date().toISOString(),
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { error: "검색 집계를 불러오지 못했어요." },
      { status: 503, headers },
    );
  }
}
export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).origin !== new URL(request.url).origin)
      return NextResponse.json({ accepted: false }, { status: 403, headers });
    const { term } = z
      .object({ term: z.string().trim().min(1).max(100) })
      .parse(await request.json());
    if (!configured() || !process.env.SUPABASE_SERVICE_ROLE_KEY)
      return NextResponse.json({ accepted: false }, { status: 202, headers });
    const canonical = eligibleSearchTerm(term, await getCatalog());
    if (!canonical)
      return NextResponse.json({ accepted: false }, { status: 202, headers });
    const address = request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();
    if (!address)
      return NextResponse.json({ accepted: false }, { status: 202, headers });
    const client = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY)
      .update(new Date().toISOString().slice(0, 10) + ":" + address)
      .digest("hex");
    const { data, error } = await adminClient().rpc("record_search_signal", {
      keyword: canonical,
      client,
    });
    if (error) {
      if (missing(error.code))
        return NextResponse.json({ accepted: false }, { status: 202, headers });
      throw error;
    }
    return NextResponse.json({ accepted: data === true }, { headers });
  } catch (error) {
    return NextResponse.json(
      { accepted: false },
      {
        status:
          error instanceof z.ZodError || error instanceof SyntaxError
            ? 400
            : 503,
        headers,
      },
    );
  }
}
