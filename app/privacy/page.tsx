import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import styles from "./privacy.module.css";

export const metadata = {
  title: "개인정보처리방침 | 구데기"
};

export default function PrivacyPage() {
  return (
    <main className={`${styles.shell} standalone-route`}>
      <article>
        <Link href="/"><ArrowLeft />구데기로 돌아가기</Link>
        <header><ShieldCheck /><div><span>PRIVACY</span><h1>개인정보처리방침</h1><p>시행일 2026년 7월 29일</p></div></header>

        <section>
          <h2>1. 수집하는 정보</h2>
          <p>로그인 시 계정 식별에 필요한 치지직 채널 ID와 로그인 시도 시각·횟수만 처리하며, 사용자 닉네임은 저장하지 않습니다. 서비스 이용 과정에서 사용자가 고른 스트리머 목록, 알림 설정, 푸시 구독 정보와 제안 내용이 저장될 수 있습니다.</p>
          <p>서비스 접속 기기 수와 PWA 설치 기기 수를 자체 집계하기 위해 무작위 익명 기기 ID와 접속·설치·홈 화면 실행 이벤트를 저장합니다. 또한 Vercel Web Analytics로 익명화된 페이지 조회 수, 접속 경로, 국가·지역, 기기 종류, 운영체제와 브라우저 정보를 집계합니다. URL의 쿼리와 해시 값은 전송 전에 제거합니다.</p>
          <p>Vercel Web Analytics는 쿠키를 사용하지 않으며, Clarity 같은 세션 녹화 도구는 사용하지 않습니다. 클릭, 스크롤과 입력 내용도 수집하지 않습니다.</p>
          <p>OAuth 액세스 토큰, 네이버 쿠키와 인증 코드는 저장하거나 로그에 남기지 않습니다.</p>
        </section>
        <section>
          <h2>2. 이용 목적</h2>
          <p>계정별 알림 목록 동기화, 방송 알림 전송, 스트리머 추가 요청과 서비스 개선 의견 처리, 서비스 안정성 확인에만 사용합니다.</p>
        </section>
        <section>
          <h2>3. 보관과 삭제</h2>
          <p>익명 이용 집계 이벤트는 최대 90일 보관합니다. 계정 정보와 설정은 서비스 이용 중 보관하며, 피드백과 스트리머 요청은 운영 이력 확인을 위해 보관할 수 있습니다. 삭제를 원하면 아래 연락처로 요청해 주세요. 확인 후 관련 법령이나 운영상 필요한 최소 기록을 제외하고 삭제합니다.</p>
        </section>
        <section>
          <h2>4. 외부 서비스</h2>
          <p>서비스 제공과 익명 이용 통계 집계를 위해 Vercel을, 방송 정보 확인을 위해 치지직 공식 API를 이용합니다. 각 사업자는 서비스 제공에 필요한 범위에서 정보를 처리할 수 있습니다.</p>
        </section>
        <section>
          <h2>5. 이용자의 선택</h2>
          <p>비로그인 상태로도 사용할 수 있으며, 설정에서 알림 목록을 초기화하고 브라우저 또는 운영체제에서 알림 권한을 철회할 수 있습니다.</p>
        </section>
        <section>
          <h2>6. 문의</h2>
          <p><a href="mailto:admin@iftype.store">admin@iftype.store</a></p>
        </section>
      </article>
    </main>
  );
}
