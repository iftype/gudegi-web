import { Bell, MessageSquareText, Radio, Users } from "lucide-react";
import styles from "@/app/admin/admin.module.css";
import { formatTime } from "./api";
import { feedbackCategories, feedbackStatuses, type Overview } from "./types";

export function OverviewDashboard({
  overview,
  onOpenFeedback,
  onOpenStreamers
}: {
  overview: Overview;
  onOpenFeedback: () => void;
  onOpenStreamers: () => void;
}) {
  const rows = overview.system.database.rows;
  const pending = overview.feedback.filter((item) => item.status === "new" || item.status === "reviewing");
  const active = overview.streamers.filter((item) => item.enabled);
  const live = overview.streamers.filter((item) => item.isLive);

  return <div className={styles.dashboardStack}>
    <section className={styles.overviewCards} aria-label="운영 요약">
      <button onClick={onOpenFeedback}>
        <span><MessageSquareText size={16} />미처리 제안</span>
        <strong>{pending.length}</strong>
        <small>새 제안 {overview.feedback.filter((item) => item.status === "new").length}건</small>
      </button>
      <article>
        <span><Bell size={16} />iOS 알림 연결</span>
        <strong>{rows.iosPushSubscriptionCount ?? 0}</strong>
        <small>전체 앱 푸시 {rows.nativePushSubscriptionCount ?? 0}대</small>
      </article>
      <button onClick={onOpenStreamers}>
        <span><Users size={16} />추적 스트리머</span>
        <strong>{active.length}<em>/{overview.limits.maxActiveStreamers}</em></strong>
        <small>추적 꺼짐 {overview.streamers.length - active.length}명</small>
      </button>
      <article>
        <span><Radio size={16} />현재 방송</span>
        <strong>{live.length}</strong>
        <small>최근 1분 확인 {overview.system.collector?.checksLastMinute ?? 0}회</small>
      </article>
    </section>

    <section className={styles.workspace}>
      <div className={styles.sectionHeading}>
        <div><span className={styles.eyebrow}>INBOX STATUS</span><h2>제안 처리 현황</h2><p>앱의 네 가지 제안 유형별 미처리 건수입니다.</p></div>
        <button className={styles.secondaryButton} onClick={onOpenFeedback}>제안함 열기</button>
      </div>
      <div className={styles.categorySummary}>
        {feedbackCategories.map((category) => {
          const items = overview.feedback.filter((item) => category.key === "idea"
            ? item.category === "idea" || item.category === "other"
            : item.category === category.key);
          return <article key={category.key}>
            <span>{category.label}</span>
            <strong>{items.filter((item) => item.status === "new" || item.status === "reviewing").length}</strong>
            <small>전체 {items.length}건</small>
          </article>;
        })}
      </div>
    </section>

    <div className={styles.twoColumn}>
      <section className={styles.workspace}>
        <div className={styles.sectionHeading}>
          <div><span className={styles.eyebrow}>RECENT FEEDBACK</span><h2>최근 제안</h2></div>
        </div>
        <div className={styles.compactList}>
          {overview.feedback.slice(0, 6).map((item) => <article key={item.id}>
            <div>
              <span>{feedbackCategories.find((category) => category.key === item.category)?.label ?? "기타"}</span>
              <time>{formatTime(item.createdAt)}</time>
            </div>
            <p>{item.message}</p>
            <small>{feedbackStatuses.find((status) => status.key === item.status)?.label ?? item.status}</small>
          </article>)}
          {!overview.feedback.length && <div className={styles.emptyState}>아직 접수된 제안이 없습니다.</div>}
        </div>
      </section>

      <section className={styles.workspace}>
        <div className={styles.sectionHeading}>
          <div><span className={styles.eyebrow}>RECENT BROADCASTS</span><h2>최근 방송</h2></div>
        </div>
        <div className={styles.compactList}>
          {overview.broadcasts.slice(0, 6).map((item) => <article key={item.id}>
            <div><span>{item.channelName}</span><time>{formatTime(item.startedAt)}</time></div>
            <p>{item.title}</p>
            <small>{item.category || "미분류"} · 변경 {item.changeCount}회</small>
          </article>)}
          {!overview.broadcasts.length && <div className={styles.emptyState}>아직 수집된 방송이 없습니다.</div>}
        </div>
      </section>
    </div>
  </div>;
}
