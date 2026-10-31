import type { MetadataRoute } from "next";
import { PAGES, SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({
    url: `${SITE.url}${p.href === "/" ? "" : p.href}`,
    changeFrequency: p.href === "/" || p.href === "/winners" || p.href === "/leaderboard" ? "daily" : "monthly",
    priority: p.href === "/" ? 1 : 0.6,
  }));
}
