import type { Metadata } from "next";
import { Providers } from "./providers";
import { PwaRegistration } from "@/components/pwa-registration";
import { SiteChrome } from "@/components/site-chrome";
import { VercelAnalytics } from "@/components/vercel-analytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://gudegi.vercel.app"),
  title: {
    default: "치지직 카테고리 변경 알림·알람 | 구데기",
    template: "%s · 구데기"
  },
  description: "치지직 카테고리 알림(알람) 서비스 구데기입니다. 스트리머의 카테고리와 방송 제목이 바뀌는 순간을 기록해 휴대폰으로 알려드립니다.",
  keywords: [
    "치지직",
    "구데기",
    "치지직 구데기",
    "치지직 알림",
    "치지직 카테고리 알림",
    "치지직 카테고리 알람",
    "치지직 방제 변경",
    "치지직 다시보기"
  ],
  manifest: "/manifest.webmanifest",
  applicationName: "구데기",
  category: "entertainment",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "구데기"
  },
  icons: {
    icon: [
      { url: "/gudegi-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/gudegi-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/gudegi-apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  robots: { index: true, follow: true },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  },
  openGraph: {
    title: "치지직 카테고리 변경 알림·알람 | 구데기",
    description: "치지직 카테고리 알림으로 스트리머의 카테고리와 방송 제목이 바뀌는 순간을 휴대폰에서 확인하세요.",
    url: "/",
    siteName: "구데기",
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/og-gudegi.png", width: 1200, height: 630, alt: "구데기 카테고리·방제 변경 알림" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "치지직 카테고리 변경 알림·알람 | 구데기",
    description: "치지직 카테고리 알림으로 스트리머의 카테고리와 방송 제목이 바뀌는 순간을 휴대폰에서 확인하세요.",
    images: ["/og-gudegi.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <PwaRegistration />
          <SiteChrome position="header" />
          {children}
          <SiteChrome position="footer" />
        </Providers>
        <VercelAnalytics />
      </body>
    </html>
  );
}
