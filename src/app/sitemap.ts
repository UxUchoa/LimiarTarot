import type { MetadataRoute } from "next";
import { tarotCards, tarotSpreads } from "@/lib/tarot";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const staticRoutes = ["", "/cartas", "/tiragens", "/guia"].map((route) => ({ url: `${base}${route}`, changeFrequency: "weekly" as const, priority: route === "" ? 1 : .8 }));
  return [...staticRoutes, ...tarotCards.map((card) => ({ url: `${base}/cartas/${card.slug}`, changeFrequency: "monthly" as const, priority: .7 })), ...tarotSpreads.map((spread) => ({ url: `${base}/tiragens/${spread.slug}`, changeFrequency: "monthly" as const, priority: .6 }))];
}
