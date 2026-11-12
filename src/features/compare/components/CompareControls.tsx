"use client";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { Plus, Check, X, ArrowRight, Scale } from "lucide-react";
import { addToComparison, readComparison } from "../selection";
const empty: string[] = [];
let cachedRaw: string | null = null,
  cached = empty;
const listeners = new Set<() => void>();
function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}
function snapshot() {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem("hancup.compare.v1");
  } catch {}
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = readComparison(raw);
  }
  return cached;
}
function save(ids: string[]) {
  try {
    localStorage.setItem("hancup.compare.v1", JSON.stringify(ids));
  } catch {}
  cachedRaw = JSON.stringify(ids);
  cached = ids;
  listeners.forEach((fn) => fn());
}
export function useCompare() {
  const ids = useSyncExternalStore(subscribe, snapshot, () => empty);
  return {
    ids,
    add: (id: string) => {
      const r = addToComparison(ids, id);
      save(r.ids);
      return r.reason;
    },
    remove: (id: string) => save(ids.filter((x) => x !== id)),
    clear: () => save([]),
  };
}
export function CompareButton({ id }: { id: string }) {
  const { ids, add, remove } = useCompare();
  const [message, setMessage] = useState("");
  const selected = ids.includes(id);
  return (
    <>
      <button
        type="button"
        className={`compare-button ${selected ? "selected" : ""}`}
        aria-label={selected ? "비교에서 빼기" : "비교 담기"}
        aria-pressed={selected}
        onClick={() => {
          if (selected) {
            remove(id);
            setMessage("");
          } else if (add(id) === "full")
            setMessage(
              "최대 3개까지 비교할 수 있어요. 담은 음료를 먼저 빼주세요.",
            );
        }}
      >
        {selected ? <Check size={14} /> : <Plus size={14} />} 비교
      </button>
      {message && (
        <p className="inline-error" role="status">
          {message}
        </p>
      )}
    </>
  );
}
export function CompareTray() {
  const { ids, clear } = useCompare();
  if (!ids.length) return null;
  return (
    <aside className="compare-tray" aria-label="비교할 음료">
      <span>
        <Scale size={18} />
        <b>{ids.length}잔</b>을 담았어요 <small>최대 3개</small>
      </span>
      <div>
        <button onClick={clear} aria-label="비교 선택 모두 지우기">
          <X size={17} />
        </button>
        <Link
          href={"/compare?ids=" + ids.join(",")}
          aria-label={`${ids.length}개 음료 비교하기`}
        >
          비교하기 <ArrowRight size={16} />
        </Link>
      </div>
    </aside>
  );
}
export function RemoveCompare({ id }: { id: string }) {
  const router = useRouter();
  const { remove } = useCompare();
  return (
    <button
      className="text-button"
      onClick={() => {
        remove(id);
        const p = new URLSearchParams(location.search);
        p.set(
          "ids",
          readComparison(localStorage.getItem("hancup.compare.v1")).join(","),
        );
        router.push("/compare?" + p);
      }}
    >
      빼기 <X size={12} />
    </button>
  );
}
