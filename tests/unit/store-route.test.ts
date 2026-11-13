import { afterEach, beforeEach, expect, test, vi } from "vitest";

const { rpc, search } = vi.hoisted(() => ({ rpc: vi.fn(), search: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ adminClient: () => ({ rpc }) }));
vi.mock("@/features/stores/search", async (original) => ({
  ...(await original<typeof import("@/features/stores/search")>()),
  searchStores: search,
}));
import { POST } from "@/app/api/stores/route";

beforeEach(() => {
  vi.stubEnv("KAKAO_REST_KEY", "test-rest-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
  rpc.mockReset();
  search.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
function request() {
  return new Request("https://hancup.test/api/stores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brandId: "starbucks", region: "서울 성수동" }),
  });
}

test("database budget errors are unavailable, never a claimed quota exhaustion", async () => {
  rpc.mockResolvedValue({
    data: null,
    error: { code: "PGRST202", message: "private diagnostic detail" },
  });
  const response = await POST(request());
  expect(response.status).toBe(503);
  const body = await response.json();
  expect(body.code).toBe("STORE_SEARCH_SETUP_REQUIRED");
  expect(body.error).not.toContain("한도");
  expect(JSON.stringify(body)).not.toContain("private diagnostic detail");
  expect(search).not.toHaveBeenCalled();
});
test("a rejected budget reservation still blocks Kakao requests with 429", async () => {
  rpc.mockResolvedValue({ data: false, error: null });
  const response = await POST(request());
  expect(response.status).toBe(429);
  expect(search).not.toHaveBeenCalled();
});
test("an allowed reservation returns actual search results", async () => {
  rpc.mockResolvedValue({ data: true, error: null });
  search.mockResolvedValue({ items: [], hasNext: false });
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ items: [], hasNext: false });
});

test("rejected server credentials return a safe authentication diagnostic", async () => {
  rpc.mockResolvedValue({
    data: null,
    error: { message: "private credential diagnostic" },
    status: 401,
  });
  const response = await POST(request());
  expect(response.status).toBe(503);
  const body = await response.json();
  expect(body.code).toBe("STORE_SEARCH_AUTH_FAILED");
  expect(JSON.stringify(body)).not.toContain("private credential diagnostic");
  expect(search).not.toHaveBeenCalled();
});
