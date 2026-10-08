import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://reliefbridge.net/", changeFrequency: "weekly", priority: 1 },
    { url: "https://reliefbridge.net/request-demo", changeFrequency: "monthly", priority: 0.8 },
  ];
}
