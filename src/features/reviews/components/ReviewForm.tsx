"use client";
import { useActionState } from "react";
import { saveReview, reportReview } from "../service";
import { type ReviewInput, koreanDate } from "../schema";
export function ReviewForm({
  drinkId,
  variantId,
  existing,
}: {
  drinkId: string;
  variantId: string | null;
  existing?: ReviewInput & { id: string };
}) {
  const [state, action, pending] = useActionState(saveReview, {});
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="drinkId" value={drinkId} />
      <input
        type="hidden"
        name="variantId"
        value={existing?.variantId ?? variantId ?? ""}
      />
      {existing && <input type="hidden" name="id" value={existing.id} />}
      <div className="form-row">
        <label>
          별점
          <select name="rating" defaultValue={existing?.rating ?? 5} required>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)} {n}점
              </option>
            ))}
          </select>
        </label>
        <label>
          마신 날짜
          <input
            type="date"
            name="consumedOn"
            required
            max={koreanDate()}
            defaultValue={existing?.consumedOn ?? koreanDate()}
          />
        </label>
        <label>
          공개 범위
          <select
            name="visibility"
            defaultValue={existing?.visibility ?? "private"}
          >
            <option value="private">나만 보기</option>
            <option value="public">공개 후기</option>
          </select>
        </label>
      </div>
      <label>
        한 잔의 기억 <span className="muted">선택 · 최대 1,000자</span>
        <textarea
          name="body"
          maxLength={1000}
          defaultValue={existing?.body ?? ""}
          placeholder="맛, 향, 다시 마시고 싶은 순간을 남겨보세요."
        />
      </label>
      <p className="muted">
        공개 별점은 이 음료에 남긴 내 최신 공개 기록 하나만 평균에 반영돼요.
      </p>
      <p className="muted">
        나만 보기 기록도 인기 음료 통계에 포함돼요. 내용과 작성자는 공개하지
        않으며, 집계에는 최대 5분 뒤 반영돼요.
      </p>
      <div role="status" aria-live="polite">
        {state.error && <p className="inline-error">{state.error}</p>}
        {state.success && <p className="status-box">{state.success}</p>}
      </div>
      <button className="primary-button" disabled={pending}>
        {pending ? "저장 중…" : existing ? "기록 수정하기" : "한 잔 기록하기"}
      </button>
    </form>
  );
}
export function ReportForm({ reviewId }: { reviewId: string }) {
  const [state, action, pending] = useActionState(reportReview, {});
  return (
    <details>
      <summary className="text-button">후기 신고</summary>
      <form action={action} className="form-stack" style={{ marginTop: 12 }}>
        <input type="hidden" name="reviewId" value={reviewId} />
        <label>
          신고 사유
          <textarea name="reason" maxLength={500} required />
        </label>
        <button className="apply-button" disabled={pending}>
          신고 접수하기
        </button>
        <p role="status" className="muted">
          {state.error ?? state.success}
        </p>
      </form>
    </details>
  );
}
