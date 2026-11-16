import { afterEach, beforeEach, test, expect, vi } from "vitest";
const { read, write } = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  configured: () => true,
  serverClient: async () => ({ rpc: read }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  adminClient: () => ({ rpc: write }),
}));
vi.mock("@/features/catalog/repository", async () => ({
  getCatalog: async () =>
    (await import("../../data/catalog/initial.json")).default,
}));
import { GET, POST } from "@/app/api/search/activity/route";
beforeEach(() => {
  read.mockReset();
  write.mockReset();
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "local-test-secret");
});
afterEach(() => vi.unstubAllEnvs());
test("absent migration has an honest unavailable state", async () => {
  read.mockResolvedValue({ data: null, error: { code: "PGRST202" } });
  expect(await (await GET()).json()).toMatchObject({
    available: false,
    items: [],
  });
});
test("aggregate response strips identities and raw timestamps", async () => {
  read.mockResolvedValue({
    data: [
      {
        term: "라떼",
        recent: "4",
        previous: "1",
        growth: "3",
        client_hash: "private-client",
        searched_at: "private-time",
      },
    ],
    error: null,
  });
  const body = await (await GET()).json();
  expect(body.items).toEqual([
    { term: "라떼", recent: 4, previous: 1, growth: 3 },
  ]);
  expect(JSON.stringify(body)).not.toContain("private");
});
function request(term: string) {
  return new Request("https://hancup.test/api/search/activity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.1",
    },
    body: JSON.stringify({ term, client: "forged-client" }),
  });
}
test("unknown free text never reaches the signal writer", async () => {
  expect(await (await POST(request("private@email.example"))).json()).toEqual({
    accepted: false,
  });
  expect(write).not.toHaveBeenCalled();
});
test("eligible searches use a server-derived daily hash instead of client input or raw IP", async () => {
  write.mockResolvedValue({ data: true, error: null });
  expect(await (await POST(request("라떼"))).json()).toEqual({
    accepted: true,
  });
  const args = write.mock.calls[0][1];
  expect(args.keyword).toBe("라떼");
  expect(args.client).toMatch(/^[a-f0-9]{64}$/);
  expect(args.client).not.toContain("203.0.113.1");
  expect(args.client).not.toContain("forged-client");
});
