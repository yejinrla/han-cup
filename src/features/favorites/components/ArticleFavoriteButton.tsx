"use client";
import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setArticleFavorite } from "../article-service";

export function ArticleFavoriteButton({
  slug,
  initial = false,
  available = true,
}: {
  slug: string;
  initial?: boolean;
  available?: boolean;
}) {
  const [saved, setSaved] = useState(initial);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="article-like-control">
      <button
        type="button"
        className={"article-like-button" + (saved ? " is-favorite" : "")}
        disabled={pending || !available}
        aria-pressed={saved}
        aria-label={saved ? "아티클 좋아요 해제" : "아티클 좋아요하기"}
        onClick={() =>
          start(async () => {
            const result = await setArticleFavorite(slug, !saved);
            setFailed(Boolean(result.error));
            if (result.error) setMessage(result.error);
            else {
              setSaved(Boolean(result.saved));
              setMessage(
                result.saved
                  ? "아티클을 좋아요에 저장했어요."
                  : "아티클 좋아요를 해제했어요.",
              );
              router.refresh();
            }
          })
        }
      >
        <Heart
          size={17}
          aria-hidden="true"
          fill={saved ? "currentColor" : "none"}
        />
        {pending ? "저장 중…" : saved ? "좋아요 취소" : "좋아요"}
      </button>
      {!available && <p className="muted">아티클 좋아요를 준비하고 있어요.</p>}
      <p role="status" className={failed ? "inline-error" : "sr-only"}>
        {message}
      </p>
    </div>
  );
}
