import { z } from "zod";
import { brands, type BrandId } from "@/features/catalog/types";
import type { Store } from "./types";
const inputSchema = z
  .object({
    brandId: z.enum([
      "starbucks",
      "twosome",
      "ediya",
      "mega",
      "compose",
      "paik",
    ]),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    region: z.string().trim().min(1).max(100).optional(),
    page: z.number().int().min(1).max(3).default(1),
  })
  .refine(
    (x) => Boolean(x.region) || (x.lat !== undefined && x.lng !== undefined),
    "지역이나 현재 위치를 선택하세요.",
  );
export function validateStoreInput(input: unknown) {
  return inputSchema.parse(input);
}
const keyword: Record<BrandId, string> = {
  ...brands,
  mega: "메가MGC커피",
  compose: "컴포즈커피",
  paik: "빽다방",
};
const aliases: Record<BrandId, string[]> = {
  starbucks: ["스타벅스"],
  twosome: ["투썸플레이스"],
  ediya: ["이디야"],
  mega: ["메가mgc커피", "메가엠지씨커피", "메가커피"],
  compose: ["컴포즈커피"],
  paik: ["빽다방"],
};
export class KakaoLocalError extends Error {
  constructor(readonly status: number) {
    super("매장 검색을 잠시 이용할 수 없어요.");
    this.name = "KakaoLocalError";
  }
}
export async function searchStores(
  input: unknown,
  fetcher: typeof fetch = fetch,
  apiKey = process.env.KAKAO_REST_KEY,
) {
  const p = validateStoreInput(input);
  if (!apiKey) throw new Error("매장 검색 연결을 준비하고 있어요.");
  const request = async (path: string, query: URLSearchParams) => {
    const res = await fetcher(
      "https://dapi.kakao.com/v2/local/" + path + "?" + query,
      {
        headers: { Authorization: "KakaoAK " + apiKey },
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      },
    );
    if (!res.ok) throw new KakaoLocalError(res.status);
    return res.json();
  };
  let lat = p.lat,
    lng = p.lng;
  if (p.region) {
    const area = await request(
      "search/address.json",
      new URLSearchParams({ query: p.region, size: "1" }),
    );
    if (!area.documents?.length) return { items: [], hasNext: false };
    lat = Number(area.documents[0].y);
    lng = Number(area.documents[0].x);
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
      throw new Error("검색 지역을 확인해 주세요.");
  }
  const data = await request(
    "search/keyword.json",
    new URLSearchParams({
      query: keyword[p.brandId],
      category_group_code: "CE7",
      x: String(lng),
      y: String(lat),
      radius: "10000",
      sort: "distance",
      size: "15",
      page: String(p.page),
    }),
  );
  const items: Store[] = (data.documents ?? []).flatMap(
    (d: Record<string, string>) => {
      const name = (d.place_name ?? "").replace(/\s/g, "").toLowerCase();
      if (
        d.category_group_code !== "CE7" ||
        !aliases[p.brandId].some((a) => name.startsWith(a))
      )
        return [];
      let url: URL;
      try {
        url = new URL(d.place_url);
        if (
          !["place.map.kakao.com", "map.kakao.com"].includes(url.hostname) ||
          !["http:", "https:"].includes(url.protocol)
        )
          return [];
        url.protocol = "https:";
      } catch {
        return [];
      }
      const y = Number(d.y),
        x = Number(d.x);
      if (!Number.isFinite(y) || !Number.isFinite(x)) return [];
      return [
        {
          id: d.id,
          name: d.place_name,
          address: d.road_address_name || d.address_name,
          phone: d.phone || null,
          lat: y,
          lng: x,
          distanceM: d.distance ? Number(d.distance) : null,
          placeUrl: url.toString(),
        },
      ];
    },
  );
  return { items, hasNext: data.meta?.is_end === false && p.page < 3 };
}
