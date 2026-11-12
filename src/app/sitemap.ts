import type { MetadataRoute } from "next";
import { getCatalog } from "@/features/catalog/repository";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return [];
  const { drinks } = await getCatalog();
  return [
    { url: base },
    { url: base + "/search" },
    ...drinks
      .filter((d) => d.status === "active")
      .map((d) => ({ url: base + "/drinks/" + d.slug })),
  ];
}
