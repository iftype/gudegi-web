import type { MetadataRoute } from "next";

const siteUrl = "https://gudegi.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${siteUrl}/docs`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2
    }
  ];
}
