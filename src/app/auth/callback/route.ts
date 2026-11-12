import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { safeReturnTo } from "@/lib/auth/redirect";
export async function GET(request: Request) {
  const u = new URL(request.url);
  const code = u.searchParams.get("code");
  if (code) {
    const db = await serverClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(safeReturnTo(u.searchParams.get("next")), u.origin),
      );
  }
  return NextResponse.redirect(new URL("/login?error=oauth", u.origin));
}
