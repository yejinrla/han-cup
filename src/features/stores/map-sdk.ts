export type ScriptLike = {
  src: string;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  remove: () => void;
};
export type MapsNamespace = { load: (fn: () => void) => void };
export type LoaderDeps<M extends MapsNamespace> = {
  document: {
    createElement: (tag: "script") => ScriptLike;
    head: { append: (el: ScriptLike) => void };
  };
  window: { kakao?: { maps?: M } };
  timeoutMs?: number;
};
const SDK_URL = "https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=";
export function createKakaoMapsLoader<M extends MapsNamespace>(
  deps: LoaderDeps<M>,
) {
  const timeoutMs = deps.timeoutMs ?? 10000;
  let pending: Promise<M> | undefined;
  function load(key: string): Promise<M> {
    if (pending) return pending;
    const attempt = new Promise<M>((resolve, reject) => {
      const script = deps.document.createElement("script");
      script.src = SDK_URL + encodeURIComponent(key);
      const fail = () => {
        clearTimeout(timer);
        script.onload = null;
        script.onerror = null;
        script.remove();
        if (pending === attempt) pending = undefined;
        reject(new Error("지도 연결 실패"));
      };
      const timer = setTimeout(fail, timeoutMs);
      script.onerror = fail;
      script.onload = () => {
        const maps = deps.window.kakao?.maps;
        if (!maps) return fail();
        maps.load(() => {
          clearTimeout(timer);
          resolve(maps);
        });
      };
      deps.document.head.append(script);
    });
    pending = attempt;
    return attempt;
  }
  return { load };
}
