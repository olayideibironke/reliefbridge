import type { MetadataRoute } from "next";

const publicPaths = ["/", "/request-demo", "/features", "/solutions", "/case-management", "/disaster-recovery", "/partners", "/pricing", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({ url: "https://reliefbridge.net" + path, changeFrequency: path === "/" ? "weekly" : "monthly", priority: path === "/" ? 1 : path === "/request-demo" ? 0.9 : 0.7 }));
}
