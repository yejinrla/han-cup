import { test, expect } from "vitest";
import { safeReturnTo } from "@/lib/auth/redirect";
test("OAuth redirects stay on this service", () => {
  for (const x of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
  ])
    expect(safeReturnTo(x)).toBe("/");
  expect(safeReturnTo("/me/favorites?add=abc")).toBe("/me/favorites?add=abc");
});
