import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "구데기 · 원하는 방송만 골라보기",
    short_name: "구데기",
    description: "스트리머 VOD 달력과 카테고리 변경 알림",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#07080b",
    theme_color: "#07080b",
    lang: "ko",
    categories: ["entertainment", "utilities"],
    prefer_related_applications: false,
    icons: [
      { src: "/gudegi-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/gudegi-icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/gudegi-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
