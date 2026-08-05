import { Activity, Database, HardDrive, Server } from "lucide-react";
import styles from "@/app/admin/admin.module.css";
import { formatBytes } from "./api";
import type { Overview } from "./types";

export function ServerDashboard({ overview }: { overview: Overview }) {
  const { system } = overview;
  const rows = system.database.rows;
  const sqliteBytes = system.database.sqlite.databaseBytes + system.database.sqlite.walBytes;
  const memoryUsed = system.host.totalMemoryBytes - system.host.freeMemoryBytes;
  return <div className={styles.dashboardStack}>
    <section className={styles.serverCards}>
      <article><span><Activity size={15} />수집 상태</span><strong>{system.collector?.running ? "정상" : "확인 필요"}</strong><small>추적 {system.collector?.trackedCount ?? 0} · 오류 {system.collector?.errorCount ?? 0}</small></article>
      <article><span><Server size={15} />메모리</span><strong>{formatBytes(memoryUsed)}</strong><small>Node {formatBytes(system.memory.rss)}</small></article>
      <article><span><HardDrive size={15} />디스크 여유</span><strong>{formatBytes(system.database.disk.freeBytes)}</strong><small>전체 {formatBytes(system.database.disk.totalBytes)}</small></article>
      <article><span><Database size={15} />SQLite</span><strong>{formatBytes(sqliteBytes)}</strong><small>WAL {formatBytes(system.database.sqlite.walBytes)}</small></article>
    </section>

    <section className={styles.workspace}>
      <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>APP DELIVERY</span><h2>앱·알림 상태</h2></div></div>
      <div className={styles.categorySummary}>
        <article><span>iOS 연결</span><strong>{rows.iosPushSubscriptionCount ?? 0}</strong><small>Android {rows.androidPushSubscriptionCount ?? 0}</small></article>
        <article><span>알림 설정</span><strong>{rows.nativePushPreferenceCount ?? 0}</strong><small>앱 저장 {rows.appInstallationCount ?? 0}대</small></article>
        <article><span>전송 완료</span><strong>{rows.nativeSentNotificationCount ?? 0}</strong><small>누적 앱 푸시</small></article>
        <article><span>전송 대기</span><strong>{rows.nativePendingNotificationCount ?? 0}</strong><small>재시도 {rows.nativeFailedNotificationCount ?? 0}건</small></article>
      </div>
    </section>

    <section className={styles.workspace}>
      <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>OFFICIAL API</span><h2>치지직 공식 API 상태</h2></div></div>
      <div className={styles.categorySummary}>
        <article><span>최근 1분 호출</span><strong>{system.chzzkApi?.callsLastMinute ?? 0}</strong><small>최근 1시간 {system.chzzkApi?.callsLastHour ?? 0}회</small></article>
        <article><span>API 오류</span><strong>{system.chzzkApi?.failuresLastHour ?? 0}</strong><small>최근 1시간</small></article>
        <article><span>평균 응답</span><strong>{system.chzzkApi?.averageLatencyMs ?? 0}ms</strong><small>공식 Open API</small></article>
        <article><span>서버 오류</span><strong>{system.http.errors5xxLastHour}</strong><small>최근 1시간 집계</small></article>
      </div>
      <p className={styles.serverFootnote}>개별 요청 로그와 배포 로그는 저장하거나 표시하지 않습니다.</p>
    </section>
  </div>;
}
