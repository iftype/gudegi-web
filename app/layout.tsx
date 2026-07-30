import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Providers } from "./providers";
import { PwaRegistration } from "@/components/pwa-registration";
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
          <header className="site-header sticky top-0 z-50 mx-auto flex h-[76px] w-[min(1240px,calc(100%-40px))] items-center justify-between border-b border-[#cbcfc8] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-[14px] max-[600px]:h-[66px] max-[600px]:w-[calc(100%-28px)]">
            <Link href="/" className="inline-flex items-center gap-2.5 font-mono text-[19px] font-bold tracking-[-0.08em]" aria-label="치지직 방송 타임라인 홈">
              <BrandMark className="size-[34px]" />
              <span>구데기</span>
            </Link>
            <nav className="flex gap-[30px] text-[13px] font-semibold max-[600px]:gap-3.5 max-[600px]:text-[11px]" aria-label="주요 메뉴">
              <Link className="text-[#5a625d] transition-colors hover:text-[#07160d]" href="/#live">라이브</Link>
              <Link className="text-[#5a625d] transition-colors hover:text-[#07160d]" href="/#calendar">달력</Link>
              <Link className="text-[#5a625d] transition-colors hover:text-[#07160d]" href="/#archive">지난 방송</Link>
            </nav>
          </header>
          {children}
          <footer className="site-footer mx-auto flex w-[min(1180px,calc(100%-40px))] justify-between gap-[50px] border-t border-[#cdd1cb] py-[42px] pb-[54px] text-[10px] text-[#7b837e] max-[600px]:w-[calc(100%-28px)] max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-3.5">
            <div className="flex items-center gap-5 max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-3.5">
              <span className="font-mono text-sm font-bold">구데기</span>
              <p>방송의 카테고리와 방제 변경을 기록합니다.</p>
            </div>
            <p>치지직 공식 서비스가 아니며, 19세 방송과 채팅은 수집하지 않습니다.</p>
          </footer>
        </Providers>
        <VercelAnalytics />
      </body>
    </html>
  );
}
