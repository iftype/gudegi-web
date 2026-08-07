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
        <header><ShieldCheck /><div><span>PRIVACY</span><h1>개인정보처리방침</h1><p>시행일 2026년 8월 8일</p></div></header>

        <section>
          <h2>1. 수집하는 정보</h2>
          <p>앱은 계정 가입이나 로그인을 요구하지 않습니다. 알림과 기기별 설정 동기화를 위해 무작위로 생성한 설치 식별자, 푸시 토큰, 기기 플랫폼, 사용자가 고른 스트리머 목록과 알림 조건을 처리합니다.</p>
          <p>제안 기능을 사용하면 입력한 제안·오류 제보·사용성 의견 또는 스트리머 추가 요청과 무작위 설치 식별자가 저장됩니다. 이름, 전화번호, 이메일 주소는 입력받지 않으며 제안 입력란에도 개인정보를 작성하지 않도록 안내합니다.</p>
          <p>웹사이트는 서비스 이용 현황을 확인하기 위해 무작위 익명 기기 ID와 접속·설치·홈 화면 실행 이벤트를 자체 집계할 수 있습니다. 또한 Vercel Web Analytics로 쿠키 없이 익명화된 페이지 조회 수, 접속 경로, 국가·지역, 기기 종류, 운영체제와 브라우저 정보를 집계할 수 있습니다. URL의 쿼리와 해시 값은 전송 전에 제거합니다.</p>
          <p>치지직 계정 정보, 로그인 정보, OAuth 액세스 토큰, 네이버 쿠키와 인증 코드는 수집하거나 저장하지 않습니다. 세션 녹화 도구를 사용하지 않으며 입력 내용·클릭·스크롤을 분석 목적으로 수집하지 않습니다.</p>
        </section>
        <section>
          <h2>2. 이용 목적</h2>
          <p>기기별 알림 목록 동기화, 방송 알림 전송, 스트리머 추가 요청과 서비스 개선 의견 처리, 서비스 이용 현황 및 안정성 확인에만 사용합니다.</p>
        </section>
        <section>
          <h2>3. 보관과 삭제</h2>
          <p>익명 이용 집계 이벤트는 최대 90일 보관합니다. 설치 식별자, 푸시 구독 정보와 알림 설정은 서비스 이용 중 보관하며, 피드백과 스트리머 요청은 운영 이력 확인을 위해 보관할 수 있습니다. 삭제를 원하면 아래 연락처로 요청해 주세요. 확인 후 관련 법령이나 운영상 필요한 최소 기록을 제외하고 삭제합니다.</p>
        </section>
        <section>
          <h2>4. 외부 서비스</h2>
          <p>웹사이트 제공과 익명 이용 통계 집계를 위해 Vercel을, 서버 운영을 위해 Oracle Cloud를, 앱 알림 전송을 위해 Expo 및 Apple·Google의 푸시 알림 서비스를 이용합니다. 방송·채널의 공개 정보 확인과 방송 페이지 연결을 위해 치지직 서비스를 이용합니다. 각 사업자는 서비스 제공에 필요한 범위에서 정보를 처리할 수 있습니다.</p>
        </section>
        <section>
          <h2>5. 이용자의 선택</h2>
          <p>로그인 없이 사용할 수 있습니다. 설정에서 알림 목록을 초기화하고 운영체제에서 알림 권한을 철회할 수 있으며, 서버에 저장된 정보의 삭제는 아래 연락처로 요청할 수 있습니다.</p>
        </section>
        <section>
          <h2>6. 문의</h2>
          <p><a href="mailto:admin@iftype.store">admin@iftype.store</a></p>
        </section>
      </article>
    </main>
  );
}
