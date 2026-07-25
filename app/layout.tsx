import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "치지직 방송 타임라인",
    template: "%s · 치지직 방송 타임라인"
  },
  description: "채팅 반응이 모인 순간을 찾아보는 치지직 방송 타임라인",
  robots: { index: true, follow: true },
  openGraph: {
    title: "치지직 방송 타임라인",
    description: "채팅 반응이 모인 순간을 찾아보세요.",
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "채팅이 터진 순간 — 치지직 방송 타임라인" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "치지직 방송 타임라인",
    description: "채팅 반응이 모인 순간을 찾아보세요.",
    images: ["/og.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <header className="site-header">
            <Link href="/" className="brand" aria-label="치지직 방송 타임라인 홈">
              <span className="brand-mark"><Activity size={18} /></span>
              <span>CHAT<span>LINE</span></span>
            </Link>
            <nav aria-label="주요 메뉴">
              <Link href="/#live">라이브</Link>
              <Link href="/#archive">지난 방송</Link>
            </nav>
          </header>
          {children}
          <footer>
            <div><span className="brand footer-brand">CHAT<span>LINE</span></span><p>채팅 반응을 기준으로 방송의 순간을 기록합니다.</p></div>
            <p>치지직 공식 서비스가 아니며, 표시되는 채팅은 익명 표본입니다.</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
