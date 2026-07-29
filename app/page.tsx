import type { Metadata } from "next";
import { HomeExperience } from "@/components/home-experience";

export const metadata: Metadata = {
  title: {
    absolute: "치지직 카테고리 변경 알림 | 구데기"
  },
  description: "구데기는 치지직 스트리머의 카테고리와 방송 제목이 바뀌는 순간을 기록하고 PWA 알림으로 알려주는 서비스입니다.",
  alternates: {
    canonical: "/"
  }
};

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "구데기",
  alternateName: "치지직 구데기",
  url: "https://gudegi.vercel.app/",
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Web",
  inLanguage: "ko-KR",
  description: "치지직 스트리머의 카테고리와 방송 제목 변경을 기록하고 휴대폰으로 알려주는 서비스",
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
