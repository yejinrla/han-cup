export type RecentEntry = { value: string; at: number; variant?: string };
export const RECENT_QUERIES = "hancup.searches.v1";
export const RECENT_DRINKS = "hancup.viewed.v1";
export const HISTORY_EVENT = "hancup-history-change";
const maxAge = 30 * 86400000;
export function readRecent(
  raw: string | null,
  now = Date.now(),
): RecentEntry[] {
  try {
    if (raw && raw.length > 32768) return [];
    const input: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(input)) return [];
    const seen = new Set<string>();
    return input
      .filter((row): row is RecentEntry => {
        if (
          !row ||
          typeof row.value !== "string" ||
          !row.value.trim() ||
          row.value.length > 100 ||
          !Number.isFinite(row.at) ||
          row.at < now - maxAge ||
          row.at > now + 300000 ||
          (row.variant !== undefined &&
            (typeof row.variant !== "string" ||
              !/^[0-9a-f-]{36}$/.test(row.variant)))
        )
          return false;
        const identity = row.value.trim().toLocaleLowerCase("ko");
        if (seen.has(identity)) return false;
        seen.add(identity);
        return true;
      })
      .slice(0, 12);
  } catch {
    return [];
  }
}
export function pushRecent(
  raw: string | null,
  value: string,
  now = Date.now(),
  limit = 10,
  variant?: string,
) {
  const normalized = value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 100);
  if (!normalized) return JSON.stringify(readRecent(raw, now));
  return JSON.stringify(
    [
      { value: normalized, at: now, ...(variant ? { variant } : {}) },
      ...readRecent(raw, now).filter(
        (row) =>
          row.value.toLocaleLowerCase("ko") !==
          normalized.toLocaleLowerCase("ko"),
      ),
    ].slice(0, limit),
  );
}
export function historySnapshot(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function writeHistory(key: string, raw: string | null) {
  try {
    if (raw === null) localStorage.removeItem(key);
    else localStorage.setItem(key, raw);
    window.dispatchEvent(new Event(HISTORY_EVENT));
  } catch {
    /* History is optional; search still works with storage denied. */
  }
}
export function subscribeHistory(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(HISTORY_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(HISTORY_EVENT, listener);
  };
}
