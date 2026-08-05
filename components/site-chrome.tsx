"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";

export function SiteChrome({ position }: { position: "header" | "footer" }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  if (position === "header") {
    return <header className="site-header sticky top-0 z-50 mx-auto flex h-[76px] w-[min(1240px,calc(100%-40px))] items-center justify-between border-b border-[#cbcfc8] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-[14px] max-[600px]:h-[66px] max-[600px]:w-[calc(100%-28px)]">
      <Link href="/" className="inline-flex items-center gap-2.5 font-mono text-[19px] font-bold tracking-[-0.08em]" aria-label="치지직 방송 타임라인 홈">
        <BrandMark className="size-[34px]" />
        <span>구데기</span>
      </Link>
      <nav className="flex gap-[30px] text-[13px] font-semibold max-[600px]:gap-3.5 max-[600px]:text-[11px]" aria-label="주요 메뉴">
        <Link className="text-[#5a625d] transition-colors hover:text-[#07160d]" href="/#live">라이브</Link>
        <Link className="text-[#5a625d] transition-colors hover:text-[#07160d]" href="/#calendar">달력</Link>
        <Link className="text-[#5a625d] transition-colors hover:text-[#07160d]" href="/#archive">지난 방송</Link>
      </nav>
    </header>;
  }
  return <footer className="site-footer mx-auto flex w-[min(1180px,calc(100%-40px))] justify-between gap-[50px] border-t border-[#cdd1cb] py-[42px] pb-[54px] text-[10px] text-[#7b837e] max-[600px]:w-[calc(100%-28px)] max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-3.5">
    <div className="flex items-center gap-5 max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-3.5">
      <span className="font-mono text-sm font-bold">구데기</span>
      <p>방송의 카테고리와 방제 변경을 기록합니다.</p>
    </div>
    <p>치지직 공식 서비스가 아니며, 19세 방송과 채팅은 수집하지 않습니다.</p>
  </footer>;
}
