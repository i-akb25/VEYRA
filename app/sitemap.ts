import type { MetadataRoute } from "next";
import { GOVERNMENT_PAGES, LOCATION_PAGES, PROFESSION_PAGES } from "@/lib/landing-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://veyra-pro.vercel.app";
  const paths = ["/", "/jobs", "/government-jobs", "/exams-and-higher-studies", "/about", "/sources", "/sources/submit", "/methodology", "/privacy", "/disclaimer", "/hi", ...PROFESSION_PAGES.map((item) => `/jobs/${item.slug}`), ...LOCATION_PAGES.map((item) => `/locations/${item.slug}`), ...GOVERNMENT_PAGES.map((item) => `/government-jobs/${item.slug}`)];
  return paths.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: ["/", "/jobs", "/government-jobs"].includes(path) ? "daily" as const : "weekly" as const, priority: path === "/" ? 1 : path.includes("jobs") ? 0.85 : 0.7 }));
}
