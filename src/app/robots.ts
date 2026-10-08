import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/request-demo"],
        disallow: ["/app/", "/api/", "/login", "/signup", "/forgot-password", "/reset-password", "/activate-staff"],
      },
    ],
    sitemap: "https://reliefbridge.net/sitemap.xml",
    host: "https://reliefbridge.net",
  };
}
