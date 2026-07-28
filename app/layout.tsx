import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { Activity } from "lucide-react";
import { Providers } from "./providers";
import { PwaRegistration } from "@/components/pwa-registration";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "치지직 방송 변경 알림",
    template: "%s · 치지직 방송 변경 알림"
  },
  description: "스트리머의 카테고리와 방제 변경을 기록하고 알려드립니다.",
  manifest: "/manifest.webmanifest",
  applicationName: "구데기",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "구데기"
  },
  icons: {
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "치지직 방송 변경 알림",
    description: "카테고리와 방제 변경을 놓치지 마세요.",
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "치지직 방송 카테고리·방제 변경 알림" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "치지직 방송 변경 알림",
    description: "카테고리와 방제 변경을 놓치지 마세요.",
    images: ["/og.png"]
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
              <span className="grid size-[34px] place-items-center rounded-[10px_10px_10px_2px] bg-signal text-[#03150b]"><Activity size={18} /></span>
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
        <Analytics />
      </body>
    </html>
  );
}
