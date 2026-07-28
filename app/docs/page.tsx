import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import styles from "./docs.module.css";

export const metadata: Metadata = {
  title: "팀 프로젝트 기획서",
  description: "TRACKLINE 팀 프로젝트 기획과 가설 검증 결과",
  robots: { index: true, follow: true },
  openGraph: {
    title: "TRACKLINE 팀 프로젝트 기획서",
    description: "원하는 방송 콘텐츠가 시작될 때 알려주고, 다시보기의 해당 구간까지 연결합니다.",
    type: "article"
  }
};

const evidenceLinks = [
  {
    label: "PWA 관련 제안 글 (2024)",
    href: "https://game.naver.com/lounge/chzzk/board/detail/4220448"
  },
  {
    label: "카테고리 알림 질문 글 (2026)",
    href: "https://gall.dcinside.com/mgallery/board/view/?id=chzzk&no=10790082"
  },
  {
    label: "비슷한 알림 서비스",
    href: "https://www.map-doya.site/announcements#settlement-2026-06"
  }
];

const roadmap = [
  ["1주차", "방문·PWA 설치·알림 설정·클릭·재방문을 측정하도록 분석 이벤트를 정리한다."],
  ["2주차", "관련 팬 커뮤니티에 서비스를 올리고, 게시물별 링크로 유입 경로를 구분해 측정한다."],
  ["3주차", "변경 알림과 다시보기·달력을 운영하며 기능별 이용률을 비교한다."],
  ["4주차", "유입 경로별 설치율·알림 클릭률·재방문율을 비교해 계속할 기능을 정한다."]
];

export default function DocsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <Link href="/" className={styles.back}>
          <ArrowLeft size={15} />
          서비스로 돌아가기
        </Link>
        <a className={styles.download} href="/docs/trackline-team-project-proposal.pdf" download>
          <Download size={15} />
          PDF 내려받기
        </a>
      </div>

      <article className={styles.document}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>TEAM PROJECT PROPOSAL · 2026.07.28</p>
          <h1>TRACKLINE</h1>
          <p className={styles.subtitle}>
            원하는 콘텐츠가 시작될 때 알려주고,
            <br />
            나중에는 다시보기의 그 장면까지 바로 연결하는 서비스
          </p>
          <div className={styles.summary}>
            <strong>한 줄 기획</strong>
            <p>
              방송이 켜졌을 때가 아니라 내가 원하는 게임이나 방송 제목으로 바뀌었을 때 알려준다.
              방송이 끝난 뒤에는 달력과 변경 기록으로 원하는 다시보기 구간을 쉽게 찾게 한다.
            </p>
          </div>
        </header>

        <section>
          <p className={styles.sectionNumber}>01</p>
          <h2>누구의 어떤 문제인가</h2>
          <div className={styles.twoColumns}>
            <div>
              <h3>처음 적용할 사용자</h3>
              <p>
                조강현·파카처럼 방송 중 여러 게임과 콘텐츠를 바꾸는 스트리머의 팬이다.
                방송 전체는 보기 어렵지만 관심 있는 게임은 놓치고 싶지 않은 사람을 먼저 만난다.
              </p>
            </div>
            <div>
              <h3>해결하려는 불편</h3>
              <p>
                치지직은 방송 시작은 알려주지만 원하는 게임이 시작된 순간은 알려주지 않는다.
                긴 다시보기에서도 방송 제목과 카테고리가 언제 바뀌었는지 직접 찾아야 한다.
              </p>
            </div>
          </div>
        </section>

        <section>
          <p className={styles.sectionNumber}>02</p>
          <h2>지금까지 무엇을 확인했나</h2>
          <div className={styles.validationList}>
            <div>
              <span className={styles.complete}>완료</span>
              <h3>타겟 사용자 정의</h3>
              <p>방송 전체보다 관심 있는 게임 구간을 놓치고 싶지 않은 팬으로 범위를 좁혔다.</p>
            </div>
            <div>
              <span>부분 확인</span>
              <h3>문제 검증</h3>
              <p>
                관련 질문 글과 비슷한 서비스를 찾았다. 다음에는 커뮤니티에 서비스를 올리고
                게시물 반응과 실제 방문·설치 데이터를 함께 측정한다.
              </p>
            </div>
            <div>
              <span>부분 확인</span>
              <h3>해결책 검증</h3>
              <p>
                달력, 방송 제목·카테고리 기록, PWA 알림을 만들었다.
                실제 사용자의 설치와 이용은 아직 측정하지 못했다.
              </p>
            </div>
          </div>
          <div className={styles.conclusion}>
            <strong>검증 결론</strong>
            <p>
              처음 정한 통과 기준은 달성하지 못했다. 다만 비슷한 질문과 서비스가 있어
              수요가 있을 가능성은 확인했다. 현재 자신감은 <b>3/10</b>이다.
            </p>
          </div>
          <div className={styles.evidence}>
            <h3>확인한 자료</h3>
            {evidenceLinks.map((item) => (
              <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
                {item.label}
                <ExternalLink size={13} />
              </a>
            ))}
          </div>
        </section>

        <section>
          <p className={styles.sectionNumber}>03</p>
          <h2>팀 프로젝트에서 만들 것</h2>
          <ol className={styles.steps}>
            <li>
              <span>1</span>
              <p>사용자가 원하는 스트리머와 카테고리 변경·방송 제목 변경 알림을 선택한다.</p>
            </li>
            <li>
              <span>2</span>
              <p>변경이 감지되면 휴대폰으로 알리고, 누르면 치지직 앱이나 웹 방송으로 이동한다.</p>
            </li>
            <li>
              <span>3</span>
              <p>방송이 끝나면 변경된 시간을 다시보기 주소에 붙여 원하는 장면부터 바로 재생한다.</p>
            </li>
            <li>
              <span>4</span>
              <p>스트리머별 월간 달력과 변경 기록을 팬 커뮤니티에 공유할 수 있게 한다.</p>
            </li>
          </ol>
        </section>

        <section>
          <p className={styles.sectionNumber}>04</p>
          <h2>4주 동안 어떻게 확인할 것인가</h2>
          <div className={styles.roadmap}>
            {roadmap.map(([week, description]) => (
              <div key={week}>
                <strong>{week}</strong>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className={styles.sectionNumber}>05</p>
          <h2>커뮤니티 배포와 성공 기준</h2>
          <p className={styles.lead}>
            고정 인원을 직접 섭외하지 않는다. 관련 팬 커뮤니티에 서비스를 공개하고,
            게시물별 링크와 이용 기록으로 실제 행동을 측정한다.
          </p>
          <ul className={styles.metrics}>
            <li><strong>10% 이상</strong><span>방문자 중 PWA 설치</span></li>
            <li><strong>30% 이상</strong><span>설치자 중 알림 설정</span></li>
            <li><strong>20% 이상</strong><span>알림을 받은 사용자의 클릭</span></li>
            <li><strong>20% 이상</strong><span>7일 내 재방문</span></li>
          </ul>
          <p className={styles.note}>
            각 지표에는 실제 측정 인원을 함께 표시한다. 방문 수가 적으면 실패로 결론 내리지 않고
            배포를 더 진행한다. 알림보다 달력과 다시보기 이용이 많다면 ‘다시보기 기록 서비스’에 집중한다.
          </p>
        </section>

        <section>
          <p className={styles.sectionNumber}>06</p>
          <h2>어려운 점과 받고 싶은 피드백</h2>
          <ul className={styles.questions}>
            <li>커뮤니티 게시물만으로 충분한 방문을 만들려면 어떤 메시지와 채널을 우선해야 하는가?</li>
            <li>4주 안에 알림과 다시보기 기록을 모두 만들지, 하나에 집중해야 하는가?</li>
            <li>방문 수가 적을 때 어떤 기간과 지표를 기준으로 판단해야 하는가?</li>
            <li>비공식으로 방송 정보를 확인할 때 공개 시험에서 다룰 적정 스트리머 범위는 어디까지인가?</li>
          </ul>
        </section>

        <footer className={styles.documentFooter}>
          <strong>배운 점</strong>
          <p>
            PC용 외부 서비스는 많지만 휴대폰에서 쓰기 좋은 서비스는 부족했다.
            알림만으로 끝내지 않고 다시보기 구간 기록과 달력까지 함께 제공해야 한다.
          </p>
        </footer>
      </article>
    </main>
  );
}
