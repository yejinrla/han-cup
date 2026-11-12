import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
const [id, state, operator, reason] = process.argv.slice(2);
z.uuid().parse(id);
z.uuid().parse(operator);
z.enum(["hidden", "visible"]).parse(state);
z.string().min(1).max(500).parse(reason);
if (
  !process.env.SUPABASE_SERVICE_ROLE_KEY ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL
)
  throw new Error("운영 환경 설정이 필요합니다.");
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const member = await db
  .from("operator_roles")
  .select("user_id")
  .eq("user_id", operator)
  .maybeSingle();
if (member.error || !member.data) throw new Error("등록된 운영자가 아닙니다.");
const { data, error } = await db
  .from("reviews")
  .update({ moderation_status: state, moderation_reason: reason })
  .eq("id", id)
  .select("id");
if (error || !data?.length) throw new Error("후기를 변경하지 못했습니다.");
console.log("후기 공개 상태를 변경했습니다.");
