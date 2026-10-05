import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/"] }, sitemap: "https://veyra-pro.vercel.app/sitemap.xml", host: "https://veyra-pro.vercel.app" };
}
