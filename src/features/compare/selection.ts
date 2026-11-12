export function addToComparison(ids: string[], id: string) {
  if (ids.includes(id)) return { ids, reason: "duplicate" as const };
  if (ids.length >= 3) return { ids, reason: "full" as const };
  return { ids: [...ids, id], reason: "added" as const };
}
export function readComparison(raw: string | null) {
  try {
    const a = JSON.parse(raw ?? "[]");
    return Array.isArray(a) && a.every((x) => typeof x === "string")
      ? [...new Set<string>(a)].slice(0, 3)
      : [];
  } catch {
    return [];
  }
}
