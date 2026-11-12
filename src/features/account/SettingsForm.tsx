"use client";
import { useActionState, useState } from "react";
import { updateNickname, reauthenticate } from "@/app/me/settings/actions";
export function SettingsForm({ nickname }: { nickname: string }) {
  const [state, action, pending] = useActionState(updateNickname, {
    message: "",
  });
  const [confirmation, setConfirmation] = useState(""),
    [error, setError] = useState(""),
    [deleting, setDeleting] = useState(false);
  return (
    <>
      <section className="panel">
        <h2>공개 닉네임</h2>
        <form action={action} className="form-stack">
          <label>
            닉네임
            <input
              name="nickname"
              minLength={2}
              maxLength={20}
              required
              defaultValue={nickname}
            />
          </label>
          <button className="primary-button" disabled={pending}>
            닉네임 저장
          </button>
          <p className="muted" role="status">
            {state.message}
          </p>
        </form>
      </section>
      <section className="panel">
        <h2>한컵 탈퇴</h2>
        <p className="muted">
          탈퇴하면 공개·비공개 기록과 찜이 모두 삭제되며 복구할 수 없습니다.
          카카오 계정 자체는 삭제되지 않습니다.
        </p>
        <form action={reauthenticate} style={{ margin: "16px 0" }}>
          <button className="apply-button">탈퇴 전 카카오로 다시 로그인</button>
        </form>
        <form
          className="form-stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setDeleting(true);
            setError("");
            try {
              const res = await fetch("/api/account", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirmation }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              window.location.replace("/");
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "탈퇴를 완료하지 못했어요.",
              );
            } finally {
              setDeleting(false);
            }
          }}
        >
          <label>
            확인을 위해 ‘한컵 탈퇴’를 입력해 주세요
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            className="apply-button danger"
            disabled={deleting || confirmation !== "한컵 탈퇴"}
          >
            {deleting ? "탈퇴 처리 중…" : "기록을 삭제하고 탈퇴하기"}
          </button>
          <p role="alert" className="inline-error">
            {error}
          </p>
        </form>
      </section>
    </>
  );
}
