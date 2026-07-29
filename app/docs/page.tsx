import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import styles from "./docs.module.css";

export const metadata: Metadata = {
  title: "가설 검증 보고서 | 구데기",
  description: "치지직 카테고리 변경 알림의 문제·해결책 검증 결과와 다음 실험",
  alternates: {
    canonical: "/docs"
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "구데기 가설 검증 보고서",
    description: "커뮤니티 배포와 실제 PWA 설치 데이터로 확인한 문제·해결책 검증 결과",
    type: "article"
  }
};

const evidenceLinks = [
  {
    label: "커뮤니티 배포 게시물",
    href: "https://www.fmkorea.com/index.php?mid=ib&sort_index=pop&order_type=desc&document_srl=10144442990&listStyle=webzine"
  },
  {
    label: "PWA 관련 제안 글 (2024)",
    href: "https://game.naver.com/lounge/chzzk/board/detail/4220448"
  },
  {
    label: "카테고리 알림 질문 글 (2026)",
    href: "https://gall.dcinside.com/mgallery/board/view/?id=chzzk&no=10790082"
  },
  {
    label: "유사 알림 서비스",
    href: "https://www.map-doya.site/announcements#settlement-2026-06"
  }
];

const nextExperiments = [
  [
    "알림 가치",
    "설치자 23명 중 실제로 카테고리 알림을 켠 비율과 알림 클릭률을 측정한다.",
    "설치자의 30% 이상 알림 설정 · 수신자의 20% 이상 클릭"
  ],
  [
    "반복 사용",
    "설치자를 7일 동안 관찰해 홈 화면 실행과 재방문을 측정한다.",
    "설치자의 20% 이상이 7일 안에 재방문"
  ],
  [
    "유입 메시지",
    "기능 소개형과 실제 사용 장면형 게시물을 구분된 링크로 배포한다.",
    "게시물 조회 대비 서비스 접속률이 1% 이상인 메시지 확인"
  ]
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
          기존 기획서 PDF
        </a>
      </div>

      <article className={styles.document}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>HYPOTHESIS VALIDATION REPORT · 2026.07.29</p>
          <h1>구데기</h1>
          <p className={styles.subtitle}>
            치지직 카테고리 변경 알림,
            <br />
            사용자는 PWA를 설치해서라도 받을까?
          </p>
          <div className={styles.summary}>
            <strong>검증 결론</strong>
            <p>
              방문자 71명 중 23명이 설치해 사전에 정한 설치율 10% 기준을 넘었다.
              다만 게시물 조회 약 2만 회가 방문 71명으로 이어져 유입률은 0.36%에 그쳤다.
              따라서 <b>해결책 가설은 통과</b>, <b>커뮤니티 유입 가설은 추가 검증</b>으로 판단한다.
            </p>
          </div>
        </header>

        <section>
          <p className={styles.sectionNumber}>01 · PROBLEM</p>
          <h2>누구의 어떤 문제인가</h2>
          <div className={styles.twoColumns}>
            <div>
              <h3>처음 만난 사용자</h3>
              <p>
                조강현·파카처럼 한 방송에서 여러 게임과 콘텐츠를 바꾸는 스트리머의 팬이다.
                방송 전체를 계속 보기는 어렵지만 관심 있는 게임이 시작되는 순간은 놓치고 싶지 않다.
              </p>
            </div>
            <div>
              <h3>관찰한 불편</h3>
              <p>
                치지직 공식 앱은 방송 시작과 다시보기 업로드는 알려주지만, 방송 도중 제목이나
                카테고리가 바뀐 순간은 알려주지 않는다. 모바일에서는 이를 보완할 선택지도 적다.
              </p>
            </div>
          </div>
          <div className={styles.evidence}>
            <h3>문제 탐색 근거</h3>
            {evidenceLinks.slice(1).map((item) => (
              <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
                {item.label}
                <ExternalLink size={13} />
              </a>
            ))}
          </div>
          <p className={styles.note}>
            질문 글과 유사 서비스의 존재는 문제의 가능성을 보여주지만, 그 자체로 타겟 사용자의
            문제 빈도나 지불 의사를 검증한 것은 아니다.
          </p>
        </section>

        <section>
          <p className={styles.sectionNumber}>02 · HYPOTHESIS &amp; EXPERIMENT</p>
          <h2>무엇을 어떻게 검증했나</h2>
          <div className={styles.validationList}>
            <div>
              <span className={styles.complete}>가설</span>
              <h3>PWA를 설치해서라도 알림을 받는다</h3>
              <p>사용자는 원하는 스트리머의 카테고리 변경 알림을 위해 PWA를 설치할 것이다.</p>
            </div>
            <div>
              <span className={styles.complete}>실험</span>
              <h3>작동하는 프로토타입을 공개한다</h3>
              <p>카테고리 변경 알림 PWA를 만들고 타겟 사용자가 모인 커뮤니티 게시물로 배포했다.</p>
            </div>
            <div>
              <span className={styles.complete}>통과 기준</span>
              <h3>방문자의 10% 이상 설치</h3>
              <p>게시물 조회, 서비스 접속, PWA 설치를 차례로 기록해 행동 전환을 확인했다.</p>
            </div>
          </div>
          <div className={styles.evidence}>
            <h3>실험 증거</h3>
            <a href={evidenceLinks[0].href} target="_blank" rel="noreferrer">
              {evidenceLinks[0].label}
              <ExternalLink size={13} />
            </a>
            <span className={styles.logEvidence}>서비스 접속·설치: 서버 로그</span>
          </div>
        </section>

        <section>
          <p className={styles.sectionNumber}>03 · RESULT</p>
          <h2>실험에서 무엇이 일어났나</h2>
          <div className={styles.funnel} aria-label="커뮤니티 게시물에서 PWA 설치까지의 전환">
            <div>
              <span>커뮤니티 게시물 조회</span>
              <strong>약 20,000회</strong>
              <small>노출 지표</small>
            </div>
            <i aria-hidden="true">→</i>
            <div>
              <span>서비스 접속</span>
              <strong>71명</strong>
              <small>조회 대비 약 0.36%</small>
            </div>
            <i aria-hidden="true">→</i>
            <div className={styles.funnelSuccess}>
              <span>PWA 설치</span>
              <strong>23명</strong>
              <small>접속 대비 약 32.4%</small>
            </div>
          </div>
          <div className={styles.conclusion}>
            <strong>기준 대비</strong>
            <p>
              방문자 설치율은 <b>32.4%(23/71)</b>로 통과 기준 10%의 약 3.2배다.
              게시물 전체 조회 대비 설치율은 약 <b>0.12%</b>다.
            </p>
          </div>
          <div className={styles.resultGrid}>
            <div>
              <span className={styles.pass}>통과</span>
              <h3>해결책에 관심을 보인 사용자의 설치</h3>
              <p>
                서비스까지 들어온 사람은 PWA 설치라는 번거로운 행동도 감수했다.
                “설치 장벽 때문에 아무도 쓰지 않을 것”이라는 우려는 이번 표본에서는 약해졌다.
              </p>
            </div>
            <div>
              <span className={styles.hold}>추가 검증</span>
              <h3>게시물 노출에서 서비스 방문까지의 유입</h3>
              <p>
                높은 게시물 조회 수에 비해 실제 방문은 적었다. 타겟이 아닌 조회가 많았거나,
                게시물 메시지가 사용 이유를 충분히 전달하지 못했을 수 있다.
              </p>
            </div>
          </div>
          <p className={styles.note}>
            이번 결과만으로 지속 사용과 알림의 실제 효용까지 검증됐다고 볼 수는 없다.
            또한 게시물 조회 수는 고유 사용자 수와 다를 수 있으므로 0.36%는 참고용 유입률이다.
            접속 71명과 설치 23명도 동일한 집계 단위인지 다음 실험 전에 다시 확인한다.
          </p>
        </section>

        <section>
          <p className={styles.sectionNumber}>04 · LEARNING</p>
          <h2>무엇을 배웠나</h2>
          <div className={styles.learningGrid}>
            <div>
              <strong>01</strong>
              <p>모바일 PWA 설치는 예상보다 결정적인 장벽이 아니었다.</p>
            </div>
            <div>
              <strong>02</strong>
              <p>기능을 본 사람의 설치보다, 필요한 사람을 서비스로 데려오는 일이 더 어려웠다.</p>
            </div>
            <div>
              <strong>03</strong>
              <p>설치는 관심의 신호일 뿐이다. 알림 설정·클릭·재방문을 봐야 실제 가치가 확인된다.</p>
            </div>
            <div>
              <strong>04</strong>
              <p>공식 앱에 기능이 추가될 위험 때문에 알림 하나가 아닌 기록 데이터의 가치도 검증해야 한다.</p>
            </div>
          </div>
        </section>

        <section>
          <p className={styles.sectionNumber}>05 · NEXT ACTION</p>
          <h2>다음에는 무엇을 검증할 것인가</h2>
          <div className={styles.experimentTable}>
            {nextExperiments.map(([subject, method, criterion]) => (
              <div key={subject}>
                <strong>{subject}</strong>
                <p>{method}</p>
                <span>{criterion}</span>
              </div>
            ))}
          </div>
          <p className={styles.note}>
            설치율 32.4%는 이미 기준을 넘었으므로 다음 실험의 핵심 지표로 반복하지 않는다.
            다음 단계에서는 설치 이후의 행동과 낮은 유입률의 원인을 우선 확인한다.
          </p>
        </section>

        <section>
          <p className={styles.sectionNumber}>06 · SCOPE &amp; RISK</p>
          <h2>확장성과 종료 위험은 어떻게 다룰 것인가</h2>
          <div className={styles.twoColumns}>
            <div>
              <h3>공식 앱이 기능을 제공한다면</h3>
              <p>
                단순 카테고리 변경 알림만으로는 차별점이 사라진다. 방송 중 변경 시각을 누적해
                다시보기의 정확한 구간과 달력으로 연결하는 ‘방송 기록’의 가치를 별도로 검증한다.
              </p>
            </div>
            <div>
              <h3>비공식 API 의존성이 크다면</h3>
              <p>
                프로젝트 기간에는 공개 시험 범위를 제한하고 수집 실패율을 기록한다.
                특정 응답 구조에 결합되지 않도록 수집 계층을 분리하며, 정책·기술 변화 시
                기능을 축소할 수 있음을 전제로 한다.
              </p>
            </div>
          </div>
        </section>

        <section>
          <p className={styles.sectionNumber}>07 · FEEDBACK</p>
          <h2>리뷰에서 확인받고 싶은 것</h2>
          <ul className={styles.questions}>
            <li>71명 중 23명의 설치를 해결책의 유의미한 신호로 판단해도 되는가?</li>
            <li>다음 검증은 알림 설정·클릭·재방문 중 어떤 행동을 가장 먼저 봐야 하는가?</li>
            <li>낮은 유입률이 타겟·문제·메시지 중 어디에서 비롯됐는지 구분할 더 좋은 실험은 무엇인가?</li>
            <li>공식 기능 출시와 비공식 API 위험을 고려할 때 ‘방송 기록’ 확장이 충분히 설득력 있는가?</li>
          </ul>
        </section>

        <footer className={styles.documentFooter}>
          <strong>현재 판단</strong>
          <p>
            최초 가설의 통과 기준은 달성했다. 프로젝트를 이어가되, 다음 결정은 더 많은 기능이 아니라
            설치 이후의 반복 행동과 방송 기록의 독립적인 가치가 확인되는지에 따라 내린다.
          </p>
        </footer>
      </article>
    </main>
  );
}
