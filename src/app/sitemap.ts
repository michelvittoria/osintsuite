import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://osintsuite.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          en: `${baseUrl}`,
          pt: `${baseUrl}.br`,
        },
      },
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: {
        languages: {
          en: `${baseUrl}/about`,
          pt: `${baseUrl}.br/about`,
        },
      },
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: {
        languages: {
          en: `${baseUrl}/privacy`,
          pt: `${baseUrl}.br/privacy`,
        },
      },
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: {
        languages: {
          en: `${baseUrl}/terms`,
          pt: `${baseUrl}.br/terms`,
        },
      },
    },
  ];
}