export function safeReturnTo(value: unknown) {
  if (
    typeof value !== "string" ||
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\r\n\x00]/.test(value)
  )
    return "/";
  try {
    const u = new URL(value, "https://hancup.local");
    return u.origin === "https://hancup.local" ? u.pathname + u.search : "/";
  } catch {
    return "/";
  }
}
