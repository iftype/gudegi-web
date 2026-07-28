import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "치지직 방송 타임라인",
    short_name: "CHATLINE",
    description: "스트리머 VOD 달력과 카테고리 변경 알림",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f0e9",
    theme_color: "#101b15",
    lang: "ko",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
