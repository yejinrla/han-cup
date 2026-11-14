"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect, RedirectType } from "next/navigation";
import { journalHref } from "./calendar";
import { requireUser } from "@/lib/auth/session";
import { serverClient } from "@/lib/supabase/server";
import { validateReview } from "./schema";
export type FormState = { error?: string; success?: string };
export async function saveReview(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const db = await serverClient();
  let savedHref = "";
  try {
    const input = validateReview({
      drinkId: form.get("drinkId"),
      variantId: form.get("variantId") || null,
      rating: Number(form.get("rating")),
      body: form.get("body") ?? "",
      consumedOn: form.get("consumedOn"),
      visibility: form.get("visibility") ?? "private",
      // One checkbox per chosen option, all named "options".
      options: form.getAll("options"),
    });
    const id = form.get("id");
    const fields = {
      variant_id: input.variantId,
      rating: input.rating,
      body: input.body,
      consumed_on: input.consumedOn,
      visibility: input.visibility,
      options: input.options,
    };
    const result = id
      ? await db
          .from("reviews")
          .update(fields)
          .eq("id", z.uuid().parse(id))
          .eq("user_id", user.id)
          .select("id")
      : await db
          .from("reviews")
          .insert({ ...fields, drink_id: input.drinkId, user_id: user.id })
          .select("id");
    if (result.error || !result.data?.length)
      return { error: "기록을 저장하지 못했어요. 다시 시도해 주세요." };
    revalidatePath("/me/records");
    revalidatePath("/", "layout");
    if (!id) return { success: "한 잔을 기록했어요." };
    const cursor = Number(form.get("journalCursor"));
    const keepPage =
      input.consumedOn === form.get("originalDate") &&
      Number.isSafeInteger(cursor) &&
      cursor > 0 &&
      cursor <= 10000;
    savedHref =
      journalHref(input.consumedOn, {
        ...(keepPage ? { cursor: String(cursor) } : {}),
        saved: "1",
      }) +
      "#record-" +
      result.data[0].id;
  } catch (e) {
    // Option rules have their own messages; show them instead of the
    // general rating/text/date hint.
    const optionIssue =
      e instanceof z.ZodError
        ? e.issues.find((issue) => issue.path[0] === "options")
        : undefined;
    return {
      error:
        optionIssue?.message ??
        "별점은 1~5점, 글은 1,000자 이내로 입력하고 날짜와 음료를 확인해 주세요.",
    };
  }
  redirect(savedHref, RedirectType.replace);
}
export async function deleteReview(form: FormData) {
  const user = await requireUser();
  const id = z.uuid().parse(form.get("id"));
  const db = await serverClient();
  const { error } = await db
    .from("reviews")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error("기록을 삭제하지 못했어요.");
  revalidatePath("/", "layout");
}
export async function reportReview(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const db = await serverClient();
  try {
    const reviewId = z.uuid().parse(form.get("reviewId"));
    const reason = z.string().trim().min(1).max(500).parse(form.get("reason"));
    const { error } = await db
      .from("review_reports")
      .insert({ reporter_id: user.id, review_id: reviewId, reason });
    if (error && error.code !== "23505")
      return { error: "신고를 접수하지 못했어요." };
    return { success: "신고가 접수됐어요. 운영자가 확인하겠습니다." };
  } catch {
    return { error: "신고 사유를 1~500자로 입력해 주세요." };
  }
}
