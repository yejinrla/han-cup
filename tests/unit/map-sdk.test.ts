import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  createKakaoMapsLoader,
  type ScriptLike,
} from "@/features/stores/map-sdk";

type FakeScript = {
  src: string;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  removed: boolean;
  remove: () => void;
};

function setup(timeoutMs = 10000) {
  const scripts: FakeScript[] = [];
  const win: { kakao?: { maps?: ReturnType<typeof fakeMaps> } } = {};
  const doc = {
    createElement: () => {
      const s: FakeScript = {
        src: "",
        onload: null,
        onerror: null,
        removed: false,
        remove: () => {
          s.removed = true;
        },
      };
      return s;
    },
    head: {
      append: (s: ScriptLike) => {
        scripts.push(s as FakeScript);
      },
    },
  };
  const loader = createKakaoMapsLoader({
    document: doc,
    window: win,
    timeoutMs,
  });
  return { scripts, win, loader };
}

const fakeMaps = () => ({
  load: (fn: () => void) => fn(),
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test("an SDK that never answers fails after the time limit", async () => {
  const { loader } = setup(10000);
  const result = loader.load("browser-key");
  const settled = expect(result).rejects.toThrow("지도 연결 실패");
  await vi.advanceTimersByTimeAsync(10000);
  await settled;
});

test("a script error fails immediately without waiting for the time limit", async () => {
  const { loader, scripts } = setup(10000);
  const result = loader.load("browser-key");
  scripts[0].onerror?.();
  await expect(result).rejects.toThrow("지도 연결 실패");
});

test("a loaded SDK resolves with the Kakao maps namespace once maps.load finishes", async () => {
  const { loader, scripts, win } = setup();
  const result = loader.load("browser-key");
  const maps = fakeMaps();
  win.kakao = { maps };
  scripts[0].onload?.();
  await expect(result).resolves.toBe(maps);
  expect(scripts[0].src).toBe(
    "https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=browser-key",
  );
});

test("a script that loads without the Kakao global fails instead of hanging", async () => {
  const { loader, scripts } = setup(10000);
  const result = loader.load("browser-key");
  scripts[0].onload?.();
  await expect(result).rejects.toThrow("지도 연결 실패");
});

test("a successful load is reused without requesting the SDK again", async () => {
  const { loader, scripts, win } = setup();
  const first = loader.load("browser-key");
  const maps = fakeMaps();
  win.kakao = { maps };
  scripts[0].onload?.();
  await first;
  await expect(loader.load("browser-key")).resolves.toBe(maps);
  expect(scripts).toHaveLength(1);
});

test("after a failure the next load removes the failed script and requests a fresh one", async () => {
  const { loader, scripts, win } = setup(10000);
  const first = loader.load("browser-key");
  const failed = expect(first).rejects.toThrow("지도 연결 실패");
  await vi.advanceTimersByTimeAsync(10000);
  await failed;
  expect(scripts[0].removed).toBe(true);
  const retry = loader.load("browser-key");
  expect(scripts).toHaveLength(2);
  const maps = fakeMaps();
  win.kakao = { maps };
  scripts[1].onload?.();
  await expect(retry).resolves.toBe(maps);
});

test("a late answer from a timed-out script cannot disturb the retry in flight", async () => {
  const { loader, scripts, win } = setup(10000);
  const first = loader.load("browser-key");
  const failed = expect(first).rejects.toThrow("지도 연결 실패");
  await vi.advanceTimersByTimeAsync(10000);
  await failed;
  const retry = loader.load("browser-key");
  scripts[0].onerror?.();
  scripts[0].onload?.();
  loader.load("browser-key");
  expect(scripts).toHaveLength(2);
  const maps = fakeMaps();
  win.kakao = { maps };
  scripts[1].onload?.();
  await expect(retry).resolves.toBe(maps);
});
