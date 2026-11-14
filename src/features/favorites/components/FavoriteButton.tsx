"use client";
import { Heart } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishFavoriteChange, subscribeFavoriteChange } from "../events";
import { toggleFavorite } from "../service";
export function FavoriteButton({
  drinkId,
  initial = false,
  showLabel = false,
}: {
  drinkId: string;
  initial?: boolean;
  /** Show "찜하기"/"찜 해제" next to the heart (detail page); cards stay icon-only. */
  showLabel?: boolean;
}) {
  const [saved, setSaved] = useState(initial),
    [message, setMessage] = useState(""),
    [pending, start] = useTransition();
  const router = useRouter();
  useEffect(() => subscribeFavoriteChange(drinkId, setSaved), [drinkId]);
  return (
    <>
      <button
        className={"favorite-button " + (saved ? "is-favorite" : "")}
        disabled={pending}
        aria-label={saved ? "음료 찜 해제" : "음료 찜하기"}
        aria-pressed={saved}
        onClick={() =>
          start(async () => {
            const r = await toggleFavorite(drinkId);
            if (r.error) setMessage(r.error);
            else {
              setSaved(r.saved ?? false);
              publishFavoriteChange(drinkId, r.saved ?? false);
              router.refresh();
              setMessage(r.saved ? "찜에 저장했어요." : "찜을 해제했어요.");
            }
          })
        }
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} />
        {showLabel && <span>{saved ? "찜 해제" : "찜하기"}</span>}
      </button>
      <span className="sr-only" role="status">
        {message}
      </span>
    </>
  );
}
