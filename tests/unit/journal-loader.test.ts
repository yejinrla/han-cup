import { createServer, type ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "vitest";
import { loadJournalData } from "../../src/features/reviews/load-journal";

test("journal loads catalog, day reviews and month markers without serial network waits", async () => {
  const pending: { response: ServerResponse; payload: unknown }[] = [];
  const reply = () =>
    pending.forEach(({ response, payload }) => {
      if (!response.writableEnded) {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(payload));
      }
    });
  const server = createServer((req, res) => {
    const url = new URL(req.url!, "http://localhost");
    if (url.pathname === "/catalog") {
      pending.push({ response: res, payload: { drinks: [], variants: [] } });
    } else {
      if (
        url.pathname !== "/rest/v1/reviews" ||
        url.searchParams.get("user_id") !== "eq.owner"
      ) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "missing owner scope" }));
        return;
      }
      const day = url.searchParams.get("select") === "*";
      const validDate = day
        ? url.searchParams.get("consumed_on") === "eq.2026-11-12"
        : url.searchParams.getAll("consumed_on").includes("gte.2026-11-01") &&
          url.searchParams.getAll("consumed_on").includes("lte.2026-11-30");
      if (!validDate) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "wrong date range" }));
        return;
      }
      pending.push({
        response: res,
        payload: day
          ? [{ id: "review", body: "my private review" }]
          : [{ consumed_on: "2026-11-10" }],
      });
    }
    // No response can finish until every independent request has started.
    if (pending.length === 3) reply();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("test server address missing");
  const base = `http://127.0.0.1:${address.port}`;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let operation: ReturnType<typeof loadJournalData> | undefined;
  try {
    const db = createClient(base, "local-publishable-key", {
      auth: { persistSession: false },
    });
    operation = loadJournalData(db, "owner", "2026-11-12", 0, async () =>
      (await fetch(base + "/catalog")).json(),
    );
    const result = await Promise.race([
      operation,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), 1500);
      }),
    ]);
    expect(
      result,
      "independent reads must start without waiting for another response",
    ).not.toBeNull();
    expect(result?.rows).toEqual([{ id: "review", body: "my private review" }]);
    expect(result?.recordDates).toEqual(["2026-11-10"]);
    expect(result?.catalog).toEqual({ drinks: [], variants: [] });
  } finally {
    clearTimeout(timer);
    reply();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await operation?.catch(() => {});
  }
});
