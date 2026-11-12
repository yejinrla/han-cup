"use client";
import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { toggleFavorite } from "../service";
export function FavoriteButton({
  drinkId,
  initial = false,
}: {
  drinkId: string;
  initial?: boolean;
}) {
  const [saved, setSaved] = useState(initial),
    [message, setMessage] = useState(""),
    [pending, start] = useTransition();
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
              setMessage(r.saved ? "찜에 저장했어요." : "찜을 해제했어요.");
            }
          })
        }
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} />
      </button>
      <span className="sr-only" role="status">
        {message}
      </span>
    </>
  );
}
