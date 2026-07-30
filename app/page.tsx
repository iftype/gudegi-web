import type { Metadata } from "next";
import { HomeExperience } from "@/components/home-experience";

export const metadata: Metadata = {
  title: {
    absolute: "치지직 카테고리 변경 알림·알람 | 구데기"
  },
  description: "치지직 카테고리 알림(알람) 서비스 구데기입니다. 스트리머의 카테고리와 방송 제목이 바뀌는 순간을 PWA로 알려드립니다.",
  alternates: {
    canonical: "/"
  }
};

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "구데기",
  alternateName: [
    "치지직 구데기",
    "치지직 카테고리 알림",
    "치지직 카테고리 알람"
  ],
  url: "https://gudegi.vercel.app/",
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Web",
  inLanguage: "ko-KR",
  description: "치지직 카테고리 알림으로 스트리머의 카테고리와 방송 제목 변경을 휴대폰에 알려주는 서비스",
  keywords: [
    "치지직 카테고리 변경 알림",
    "치지직 카테고리 알림",
    "치지직 카테고리 알람"
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW"
  }
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
      />
      <HomeExperience />
    </>
  );
}
