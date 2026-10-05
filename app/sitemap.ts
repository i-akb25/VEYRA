import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://veyra-pro.vercel.app";
  return ["/", "/jobs", "/government-jobs", "/exams-and-higher-studies", "/about", "/sources", "/methodology", "/privacy", "/disclaimer"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: ["/", "/jobs", "/government-jobs"].includes(path) ? "daily" as const : "monthly" as const, priority: path === "/" ? 1 : path.includes("jobs") ? 0.85 : 0.7 }));
}
