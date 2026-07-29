"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  AlertTriangle,
  Cloud,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  History,
  LogOut,
  MemoryStick,
  Radio,
  RefreshCw,
  Send,
  Server,
  Smartphone,
  Trash2,
  Users
} from "lucide-react";
import styles from "@/app/admin/admin.module.css";

type Streamer = {
  channelId: string;
  channelName: string;
  enabled: boolean;
  isLive: boolean;
  collectorState: string;
  lastCheckedAt: number | null;
  lastError: string | null;
  followerCount: number | null;
  trackingRank: number | null;
  rankingSource: string | null;
  rankingSnapshotAt: number | null;
  profileCheckedAt: number | null;
  currentTitle: string | null;
  currentCategory: string | null;
};

type Broadcast = {
  id: string;
  channelName: string;
  title: string;
  status: string;
  startedAt: number;
  category: string | null;
  changeCount: number;
};

type ActiveCollector = {
  channelId: string;
  broadcastId: string | null;
};

type ScheduledCollector = {
  channelId: string;
  nextCheckAt: number | null;
  failureCount: number;
};

type Overview = {
  streamers: Streamer[];
  broadcasts: Broadcast[];
  limits: {
    maxActiveStreamers: number;
  };
  feedback: Array<{
    id: number;
    category: string;
    message: string;
    contact: string | null;
    status: string;
    createdAt: number;
    targetChannelId: string | null;
    targetChannelName: string | null;
    requestCount: number;
  }>;
  followImportAttempts: Array<{
    channelId: string;
    channelName: string;
    firstAttemptAt: number;
    lastAttemptAt: number;
    attemptCount: number;
  }>;
  streamerRequestDemand: Array<{
    channelId: string;
    channelName: string;
    channelImageUrl: string | null;
    requesterCount: number;
    requestCount: number;
    lastRequestedAt: number;
  }>;
  analytics: {
    since: number;
    eventCount: number;
    visitorCount: number;
    returningVisitorCount: number;
    pwaInstalledVisitorCount: number;
    pwaAppOpenVisitorCount: number;
    pwaPromptedVisitorCount: number;
    events: Array<{
      eventName: string;
      eventCount: number;
      visitorCount: number;
    }>;
    sources: Array<{ source: string; visitorCount: number }>;
  };
  system: {
    generatedAt: number;
    uptimeSeconds: number;
    memory: { rss: number; heapUsed: number; heapTotal: number };
    host: {
      totalMemoryBytes: number;
      freeMemoryBytes: number;
      loadAverage: number[];
      cpuCount: number;
    };
    database: {
      rows: {
        streamerCount: number;
        broadcastCount: number;
        liveBroadcastCount: number;
        metadataEventCount: number;
        categoryChangeCount: number;
        titleChangeCount: number;
        latestMetadataEventAt: number | null;
        pushSubscriptionCount: number;
        pushPreferenceCount: number;
        sentNotificationCount: number;
        pendingNotificationCount: number;
        failedNotificationCount: number;
        appUserCount: number;
        activeUserSessionCount: number;
      };
      sqlite: {
        databaseBytes: number;
        walBytes: number;
        sharedMemoryBytes: number;
        allocatedBytes: number;
        reusableBytes: number;
      };
      disk: { totalBytes: number; freeBytes: number };
    };
    collector: {
      enabled: boolean;
      running: boolean;
      checking: boolean;
      activeCount: number;
      trackedCount: number;
      neverCheckedCount: number;
      staleCount: number;
      errorCount: number;
      maxActiveStreamers: number;
      checkConcurrency: number;
      pollIntervalMs: number;
      schedulerIntervalMs: number;
      livePollIntervalMs: number;
      offlinePollIntervalMs: number;
      checksLastMinute: number;
      checksLastHour: number;
      failuresLastHour: number;
      nextDueAt: number | null;
      lastCycleStartedAt: number | null;
      lastCycleCompletedAt: number | null;
      lastCycleChecked: number;
      active: ActiveCollector[];
      schedule: ScheduledCollector[];
    } | null;
    http: {
      requestsLastMinute: number;
      requestsLastHour: number;
      errors4xxLastHour: number;
      errors5xxLastHour: number;
      averageLatencyMs: number;
      p95LatencyMs: number;
      eventLoopP95Ms: number;
      cpuPercent: number;
      routes: Array<{
        route: string;
        calls: number;
        failures: number;
        averageLatencyMs: number;
      }>;
      recentRequests: Array<{
        at: number;
        method: string;
        route: string;
        statusCode: number;
        latencyMs: number;
      }>;
    };
    chzzkApi: {
      callsLastMinute: number;
      callsLastHour: number;
      failuresLastHour: number;
      averageLatencyMs: number;
      byKind: Array<{ kind: string; calls: number; failures: number }>;
    } | null;
  };
};

type VercelLogs = {
  configured: boolean;
  deployment: {
    uid: string;
    url: string;
    name: string;
    state: string;
    created: number;
    ready: number | null;
  } | null;
  logs: Array<{
    id: string;
    createdAt: number;
    type: string;
    message: string;
    path: string | null;
    method: string | null;
    statusCode: number | null;
    region: string | null;
  }>;
};

async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(`/api/admin${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(response.status === 401 ? "unauthorized" : payload?.error ?? "request_failed");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unit).toFixed(unit >= 3 ? 1 : 0)} ${units[unit]}`;
}

function formatTime(value: number | null) {
  if (!value) return "기록 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(value);
}

function relativeTime(value: number | null, now: number) {
  if (!value) return "기록 없음";
  const seconds = Math.max(0, Math.floor((now - value) / 1000));
  if (seconds < 60) return `${seconds}초 전`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  return `${Math.floor(seconds / 3600)}시간 전`;
}

function relativeFuture(value: number | null, now: number) {
  if (!value) return "예약 전";
  const seconds = Math.max(0, Math.ceil((value - now) / 1000));
  if (seconds === 0) return "곧 확인";
  if (seconds < 60) return `${seconds}초 후`;
  return `${Math.ceil(seconds / 60)}분 후`;
}

function formatInterval(value: number) {
  if (value < 60_000) return `${Math.round(value / 1000)}초`;
  return `${Math.round(value / 60_000)}분`;
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await adminApi("/session", {
        method: "POST",
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password")
        })
      });
      onSuccess();
    } catch {
      setError("로그인에 실패했습니다. 5회 실패하면 5분간 제한됩니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.loginShell}>
      <form className={styles.loginCard} onSubmit={submit}>
        <span className={styles.eyebrow}>PRIVATE CONTROL ROOM</span>
        <Server size={34} aria-hidden />
        <h1>수집 관제실</h1>
        <p>서버 상태와 방송 정보 변경 흐름을 확인합니다.</p>
        <label>아이디<input name="username" defaultValue="admin" autoComplete="username" required /></label>
        <label>비밀번호<input name="password" type="password" autoComplete="current-password" required /></label>
        {error && <div className={styles.error}>{error}</div>}
        <button disabled={submitting}>{submitting ? "확인 중…" : "로그인"}</button>
        <small>비밀번호 원문은 서버에 저장하지 않습니다.</small>
      </form>
    </main>
  );
}

function Dashboard({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState("");
  const [streamerQuery, setStreamerQuery] = useState("");
  const [streamerBusy, setStreamerBusy] = useState("");
  const [streamerResult, setStreamerResult] = useState("");
  const [tab, setTab] = useState<"logs" | "management" | "server">("logs");
  const [vercelLogs, setVercelLogs] = useState<VercelLogs | null>(null);
  const [vercelError, setVercelError] = useState("");

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const result = await adminApi<{ data: Overview }>("/overview");
      setOverview(result.data);
      setError("");
    } catch (caught) {
      if (caught instanceof Error && caught.message === "unauthorized") {
        onUnauthorized();
        return;
      }
      setError("운영 정보를 불러오지 못했습니다.");
    } finally {
      if (manual) setRefreshing(false);
    }
  }, [onUnauthorized]);

  const loadVercelLogs = useCallback(async () => {
    try {
      const result = await adminApi<{ data: VercelLogs }>("/vercel-logs");
      setVercelLogs(result.data);
      setVercelError("");
    } catch (caught) {
      if (caught instanceof Error && caught.message === "unauthorized") {
        onUnauthorized();
        return;
      }
      setVercelError("Vercel 로그를 불러오지 못했습니다.");
    }
  }, [onUnauthorized]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 15_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    if (tab !== "server") return;
    const initial = window.setTimeout(() => void loadVercelLogs(), 0);
    const timer = window.setInterval(() => void loadVercelLogs(), 30_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [loadVercelLogs, tab]);

  if (!overview) {
    return <main className={styles.loading}>{error || "서버 상태를 확인하고 있습니다."}</main>;
  }

  const {
    analytics,
    system,
    streamers,
    broadcasts,
    feedback,
    followImportAttempts,
    streamerRequestDemand
  } = overview;
  const now = system.generatedAt;
  const rows = system.database.rows;
  const collector = system.collector;
  const hostMemoryUsed = system.host.totalMemoryBytes - system.host.freeMemoryBytes;
  const sqliteBytes = system.database.sqlite.databaseBytes
    + system.database.sqlite.walBytes
    + system.database.sqlite.sharedMemoryBytes;
  const lastCycleAge = collector?.lastCycleCompletedAt
    ? now - collector.lastCycleCompletedAt
    : Number.POSITIVE_INFINITY;
  const collectionHealthy = Boolean(
    collector?.running
    && (collector.checking || lastCycleAge < collector.pollIntervalMs * 2)
  );
  const analyticsVisitors = (eventName: string) =>
    analytics.events.find((event) => event.eventName === eventName)?.visitorCount ?? 0;
  const activeStreamers = streamers.filter((streamer) => streamer.enabled);
  const visibleStreamers = streamers.filter((streamer) => {
    const query = streamerQuery.trim().toLowerCase();
    return !query
      || streamer.channelName.toLowerCase().includes(query)
      || streamer.channelId.includes(query);
  });
  const scheduleByChannel = new Map(
    (collector?.schedule ?? []).map((item) => [item.channelId, item])
  );
  const rankingSnapshotAt = activeStreamers.find(
    (streamer) => streamer.rankingSnapshotAt
  )?.rankingSnapshotAt ?? null;
  const memoryPercent = system.host.totalMemoryBytes
    ? Math.round(hostMemoryUsed / system.host.totalMemoryBytes * 100)
    : 0;
  const incidents = [
    {
      label: "수집 지연",
      active: (collector?.staleCount ?? 0) > 0,
      detail: `${collector?.staleCount ?? 0}개 채널이 기준 시간을 초과했습니다.`
    },
    {
      label: "HTTP 5xx",
      active: system.http.errors5xxLastHour > 0,
      detail: `최근 1시간 ${system.http.errors5xxLastHour}건`
    },
    {
      label: "치지직 API 오류",
      active: (system.chzzkApi?.failuresLastHour ?? 0) > 3,
      detail: `최근 1시간 ${system.chzzkApi?.failuresLastHour ?? 0}건`
    },
    {
      label: "메모리 압박",
      active: memoryPercent >= 85,
      detail: `${memoryPercent}% 사용 중`
    }
  ];

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>CHZZK COLLECTION MONITOR</span>
          <h1>수집 관제실</h1>
          <p>15초마다 자동 갱신 · 마지막 확인 {formatTime(system.generatedAt)}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondary} onClick={() => void load(true)}>
            <RefreshCw className={refreshing ? styles.spinning : ""} size={15} />새로고침
          </button>
          <button className={styles.secondary} onClick={async () => {
            await adminApi("/session", { method: "DELETE" });
            onUnauthorized();
          }}><LogOut size={15} />로그아웃</button>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <nav className={styles.adminTabs} aria-label="관리 메뉴">
        {([
          ["logs", "로그 수집"],
          ["management", "관리"],
          ["server", "서버 로그"]
        ] as const).map(([value, label]) => (
          <button className={tab === value ? styles.adminTabActive : ""} key={value} onClick={() => setTab(value)}>{label}</button>
        ))}
      </nav>

      <section className={styles.metrics} hidden={tab !== "server"}>
        <article>
          <span><Activity size={15} />수집 상태</span>
          <strong className={collectionHealthy ? styles.good : styles.warn}>
            {collectionHealthy ? "정상" : "확인 필요"}
          </strong>
          <small>{collector?.activeCount ?? 0}개 LIVE · 최대 {collector?.maxActiveStreamers ?? 0}채널</small>
        </article>
        <article>
          <span><MemoryStick size={15} />서버 메모리</span>
          <strong>{formatBytes(hostMemoryUsed)}</strong>
          <small>전체 {formatBytes(system.host.totalMemoryBytes)} · Node {formatBytes(system.memory.rss)}</small>
        </article>
        <article>
          <span><HardDrive size={15} />디스크</span>
          <strong>{formatBytes(system.database.disk.freeBytes)}</strong>
          <small>전체 {formatBytes(system.database.disk.totalBytes)} 중 여유</small>
        </article>
        <article>
          <span><Database size={15} />SQLite</span>
          <strong>{formatBytes(sqliteBytes)}</strong>
          <small>WAL {formatBytes(system.database.sqlite.walBytes)}</small>
        </article>
      </section>

      <section className={styles.panel} hidden={tab !== "logs"}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>FOLLOW DEMAND</span><h2>팔로우 가져오기 수요</h2></div>
          <span className={styles.pill}>{followImportAttempts.length}명</span>
        </div>
        {followImportAttempts.length ? (
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>최근 시도</th><th>사용자</th><th>채널 ID</th><th>횟수</th></tr></thead>
              <tbody>{followImportAttempts.map((item) => (
                <tr key={item.channelId}>
                  <td>{formatTime(item.lastAttemptAt)}</td>
                  <td><strong>{item.channelName}</strong></td>
                  <td><small>{item.channelId}</small></td>
                  <td>{item.attemptCount.toLocaleString()}회</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className={styles.empty}>아직 로그인 시도가 없습니다.</p>}
      </section>

      <section className={styles.panel} hidden={tab !== "management"}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>STREAMER REQUESTS</span><h2>스트리머 추가 수요</h2></div>
          <span className={styles.pill}>{streamerRequestDemand.length}개 채널</span>
        </div>
        {streamerRequestDemand.length ? (
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>최근 요청</th><th>스트리머</th><th>채널 ID</th><th>요청자</th><th>누적 요청</th><th>관리</th></tr></thead>
              <tbody>{streamerRequestDemand.map((item) => (
                <tr key={item.channelId}>
                  <td>{formatTime(item.lastRequestedAt)}</td>
                  <td><strong>{item.channelName}</strong></td>
                  <td><small>{item.channelId}</small></td>
                  <td>{item.requesterCount.toLocaleString()}명</td>
                  <td>{item.requestCount.toLocaleString()}회</td>
                  <td>{activeStreamers.some((streamer) => streamer.channelId === item.channelId)
                    ? <span className={`${styles.status} ${styles.statusLive}`}>추적 중</span>
                    : <button disabled={streamerBusy === item.channelId} onClick={async () => {
                      setStreamerBusy(item.channelId);
                      try {
                        await adminApi("/streamers", {
                          method: "POST",
                          body: JSON.stringify({ channelId: item.channelId })
                        });
                        setStreamerResult(`${item.channelName} 채널을 추적 리스트에 추가했습니다.`);
                        await load();
                      } catch {
                        setStreamerResult("요청 채널을 추가하지 못했습니다.");
                      } finally {
                        setStreamerBusy("");
                      }
                    }}>추적 추가</button>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className={styles.empty}>아직 스트리머 추가 요청이 없습니다.</p>}
      </section>

      <section className={styles.panel} hidden={tab !== "server"}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>COLLECTOR LOAD</span><h2>상위 50명 수집 현황</h2></div>
          <span className={styles.pill}>
            LIVE {formatInterval(collector?.livePollIntervalMs ?? 0)}
            {" · "}OFFLINE {formatInterval(collector?.offlinePollIntervalMs ?? 0)}
            {" · "}동시 {collector?.checkConcurrency ?? 0}
          </span>
        </div>
        <div className={styles.freshnessGrid}>
          <article>
            <span><Radio size={14} />추적 채널</span>
            <strong>{collector?.trackedCount ?? 0} / {collector?.maxActiveStreamers ?? 50}</strong>
            <small>팔로워 순위 기준 활성 채널</small>
          </article>
          <article>
            <span><RefreshCw size={14} />확인 요청</span>
            <strong>{collector?.checksLastMinute ?? 0} /분</strong>
            <small>최근 1시간 {collector?.checksLastHour ?? 0}회</small>
          </article>
          <article>
            <span><Activity size={14} />수집 범위</span>
            <strong>{Math.max(0, (collector?.trackedCount ?? 0) - (collector?.neverCheckedCount ?? 0))}</strong>
            <small>미확인 {collector?.neverCheckedCount ?? 0} · 지연 {collector?.staleCount ?? 0}</small>
          </article>
          <article>
            <span><Server size={14} />오류</span>
            <strong className={collector?.errorCount ? styles.warn : styles.good}>{collector?.errorCount ?? 0}</strong>
            <small>최근 1시간 실패 {collector?.failuresLastHour ?? 0}회</small>
          </article>
        </div>
      </section>

      <section className={styles.panel} hidden={tab !== "management"}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>PUSH DELIVERY TEST</span><h2>테스트 메시지 보내기</h2></div>
          <span className={styles.pill}>연결 기기 {rows.pushSubscriptionCount ?? 0}대 · 최근 기기 1대로 발송</span>
        </div>
        <form className={styles.pushTestForm} onSubmit={async (event) => {
          event.preventDefault();
          setTestSending(true);
          setTestResult("전송 중…");
          const form = new FormData(event.currentTarget);
          try {
            const result = await adminApi<{ data: { sent: number } }>("/push/test", {
              method: "POST",
              body: JSON.stringify({
                title: form.get("title"),
                body: form.get("body"),
                url: "/"
              })
            });
            setTestResult(`${result.data.sent}대에 테스트 알림을 보냈습니다.`);
          } catch (caught) {
            const code = caught instanceof Error ? caught.message : "";
            setTestResult(code === "no_push_subscription"
              ? "연결된 기기가 없습니다. 휴대폰에서 먼저 알림을 켜 주세요."
              : "테스트 알림 전송에 실패했습니다. 만료 구독과 VAPID 설정을 확인하세요.");
          } finally {
            setTestSending(false);
          }
        }}>
          <label>
            <span>제목</span>
            <input name="title" defaultValue="구데기 테스트" maxLength={80} required />
          </label>
          <label>
            <span>메시지</span>
            <input name="body" defaultValue="카테고리 변경 알림이 정상적으로 연결되었습니다." maxLength={180} required />
          </label>
          <button disabled={testSending}><Send size={15} />{testSending ? "전송 중…" : "테스트 보내기"}</button>
        </form>
        {testResult && <p className={styles.pushTestResult} role="status">{testResult}</p>}
      </section>

      <section className={styles.panel} hidden={tab !== "management"}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>STREAMER OPERATIONS</span><h2>추적 리스트 관리</h2></div>
          <span className={styles.pill}>
            활성 {activeStreamers.length} / {overview.limits.maxActiveStreamers}
          </span>
        </div>
        <form className={styles.streamerAddForm} onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const channelId = String(form.get("channelId") ?? "").trim();
          setStreamerBusy(channelId);
          setStreamerResult("");
          try {
            await adminApi("/streamers", {
              method: "POST",
              body: JSON.stringify({ channelId })
            });
            event.currentTarget.reset();
            setStreamerResult("채널을 추적 리스트에 추가했습니다.");
            await load();
          } catch (caught) {
            const code = caught instanceof Error ? caught.message : "";
            setStreamerResult(code === "capacity_reached"
              ? "활성 추적 채널 한도에 도달했습니다."
              : "채널을 추가하지 못했습니다. 32자리 채널 ID를 확인하세요.");
          } finally {
            setStreamerBusy("");
          }
        }}>
          <input
            name="channelId"
            placeholder="32자리 치지직 채널 ID"
            pattern="[a-f0-9]{32}"
            aria-label="추가할 치지직 채널 ID"
            required
          />
          <button disabled={Boolean(streamerBusy)}>채널 추가</button>
        </form>
        <div className={styles.streamerManagerToolbar}>
          <input
            type="search"
            value={streamerQuery}
            onChange={(event) => setStreamerQuery(event.target.value)}
            placeholder="이름 또는 채널 ID 검색"
            aria-label="추적 채널 검색"
          />
          <span>{visibleStreamers.length}개 표시</span>
        </div>
        {streamerResult && <p className={styles.pushTestResult} role="status">{streamerResult}</p>}
        <div className={styles.streamerManagerList}>
          {visibleStreamers.map((streamer) => (
            <article key={streamer.channelId}>
              <div>
                <strong>{streamer.channelName}</strong>
                <small>{streamer.channelId}</small>
              </div>
              <div className={styles.streamerMetadata}>
                <strong>{streamer.currentCategory || (streamer.isLive ? "카테고리 확인 중" : "방송 없음")}</strong>
                <small title={streamer.currentTitle ?? undefined}>
                  {streamer.currentTitle || "현재 방송 제목 없음"}
                </small>
              </div>
              <div className={styles.streamerManagerActions}>
                <button
                  className={`${styles.toggle} ${streamer.enabled ? styles.toggleOn : ""}`}
                  aria-pressed={streamer.enabled}
                  disabled={streamerBusy === streamer.channelId}
                  onClick={async () => {
                    setStreamerBusy(streamer.channelId);
                    setStreamerResult("");
                    try {
                      await adminApi(`/streamers/${streamer.channelId}`, {
                        method: "PATCH",
                        body: JSON.stringify({ enabled: !streamer.enabled })
                      });
                      await load();
                    } catch {
                      setStreamerResult("추적 상태를 바꾸지 못했습니다.");
                    } finally {
                      setStreamerBusy("");
                    }
                  }}
                >
                  {streamer.enabled ? "추적 중" : "추적 꺼짐"}
                </button>
                <button
                  className={styles.danger}
                  aria-label={`${streamer.channelName} 추적 데이터 삭제`}
                  disabled={streamerBusy === streamer.channelId}
                  onClick={async () => {
                    if (!window.confirm(
                      `${streamer.channelName} 채널과 수집된 방송 기록을 모두 삭제할까요?`
                    )) return;
                    setStreamerBusy(streamer.channelId);
                    try {
                      await adminApi(`/streamers/${streamer.channelId}`, { method: "DELETE" });
                      setStreamerResult("채널과 관련 기록을 삭제했습니다.");
                      await load();
                    } catch {
                      setStreamerResult("채널을 삭제하지 못했습니다.");
                    } finally {
                      setStreamerBusy("");
                    }
                  }}
                >
                  <Trash2 size={14} />삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel} hidden={tab !== "server"}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>OPERATIONS</span><h2>API 호출·서버 부하·장애 감시</h2></div>
          <span className={styles.pill}>최근 1시간 롤링 지표</span>
        </div>
        <div className={styles.freshnessGrid}>
          <article>
            <span><Gauge size={14} />서비스 요청</span>
            <strong>{system.http.requestsLastMinute} /분</strong>
            <small>1시간 {system.http.requestsLastHour}회 · p95 {system.http.p95LatencyMs}ms</small>
          </article>
          <article>
            <span><Radio size={14} />치지직 API</span>
            <strong>{system.chzzkApi?.callsLastMinute ?? 0} /분</strong>
            <small>1시간 {system.chzzkApi?.callsLastHour ?? 0}회 · 평균 {system.chzzkApi?.averageLatencyMs ?? 0}ms</small>
          </article>
          <article>
            <span><Cpu size={14} />프로세스 부하</span>
            <strong>{system.http.cpuPercent}% CPU</strong>
            <small>이벤트루프 p95 {system.http.eventLoopP95Ms}ms · Load {system.host.loadAverage[0]?.toFixed(2)}</small>
          </article>
          <article>
            <span><Users size={14} />로그인 사용자</span>
            <strong>{rows.activeUserSessionCount ?? 0}</strong>
            <small>누적 사용자 {rows.appUserCount ?? 0}명</small>
          </article>
        </div>
        <div className={styles.incidentList}>
          {incidents.map((incident) => (
            <article className={incident.active ? styles.incidentActive : ""} key={incident.label}>
              <AlertTriangle />
              <div><strong>{incident.label}</strong><small>{incident.detail}</small></div>
              <span>{incident.active ? "대응 필요" : "정상"}</span>
            </article>
          ))}
        </div>
        <div className={styles.runbook}>
          <strong>장애 대응 기준</strong>
          <span>수집 지연 → 치지직 API 오류와 다음 확인 시각 확인</span>
          <span>5xx 발생 → 해당 경로·평균 지연 확인 후 최근 배포 점검</span>
          <span>메모리 85% 이상 → WAL·DB 용량 확인 후 서비스 재시작 검토</span>
          <span>알림 대기 증가 → 만료 구독 정리와 푸시 재시도 상태 확인</span>
        </div>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>API 경로</th><th>호출</th><th>평균 지연</th><th>5xx</th></tr></thead>
            <tbody>{system.http.routes.length ? system.http.routes.map((route) => (
              <tr key={route.route}>
                <td><strong>{route.route}</strong></td>
                <td>{route.calls.toLocaleString()}</td>
                <td>{route.averageLatencyMs}ms</td>
                <td className={route.failures ? styles.errorText : ""}>{route.failures}</td>
              </tr>
            )) : <tr><td colSpan={4}>서버 재시작 후 요청을 집계하고 있습니다.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel} hidden={tab !== "logs"}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>SELF-HOSTED ANALYTICS</span><h2>서비스 이용 현황</h2></div>
          <span className={styles.pill}>최근 7일 · 자체 익명 집계</span>
        </div>
        <div className={styles.freshnessGrid}>
          <article>
            <span><Users size={14} />서비스 접속</span>
            <strong>{analyticsVisitors("page_view").toLocaleString()}</strong>
            <small>고유 기기 수</small>
          </article>
          <article>
            <span><Smartphone size={14} />PWA 설치</span>
            <strong>{analytics.pwaInstalledVisitorCount.toLocaleString()}</strong>
            <small>설치 완료 또는 홈 화면 실행 기기</small>
          </article>
        </div>
      </section>

      <section className={styles.panel} hidden={tab !== "server"}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>DATA FRESHNESS</span><h2>변경 기록 상태</h2></div>
          <span className={styles.pill}>채팅 미수집 · 가동 {Math.floor(system.uptimeSeconds / 3600)}시간</span>
        </div>
        <div className={styles.freshnessGrid}>
          <article><span>마지막 변경</span><strong>{relativeTime(rows.latestMetadataEventAt, now)}</strong><small>{formatTime(rows.latestMetadataEventAt)}</small></article>
          <article><span>카테고리 변경</span><strong>{rows.categoryChangeCount.toLocaleString()}</strong><small>누적 감지 건수</small></article>
          <article><span>방제 변경</span><strong>{rows.titleChangeCount.toLocaleString()}</strong><small>누적 감지 건수</small></article>
          <article><span>알림 기기</span><strong>{rows.pushSubscriptionCount ?? 0}</strong><small>대상 설정 {rows.pushPreferenceCount ?? 0}개</small></article>
          <article><span>전송 완료</span><strong className={styles.good}>{rows.sentNotificationCount ?? 0}</strong><small>누적 변경 푸시</small></article>
          <article><span>대기 알림</span><strong className={rows.pendingNotificationCount ? styles.warn : styles.good}>{rows.pendingNotificationCount}</strong><small>아직 전송되지 않은 푸시</small></article>
          <article><span>재시도 알림</span><strong className={rows.failedNotificationCount ? styles.warn : styles.good}>{rows.failedNotificationCount ?? 0}</strong><small>전송 실패 후 재시도 중</small></article>
        </div>
      </section>

      <section className={styles.panel} hidden={tab !== "logs"}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>USER FEEDBACK</span><h2>서비스 피드백</h2></div>
          <span className={styles.pill}>최근 {feedback.length}건</span>
        </div>
        {feedback.length ? (
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>시각</th><th>종류</th><th>대상</th><th>내용</th><th>연락처</th></tr></thead>
              <tbody>{feedback.map((item) => (
                <tr key={item.id}>
                  <td>{formatTime(item.createdAt)}</td>
                  <td><span className={styles.status}>{feedbackLabel(item.category)}</span></td>
                  <td>{item.targetChannelName
                    ? <><strong>{item.targetChannelName}</strong><small>{item.targetChannelId}</small></>
                    : "-"}</td>
                  <td><strong>{item.message}</strong></td>
                  <td>{item.contact || "없음"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className={styles.empty}>아직 받은 피드백이 없습니다.</p>}
      </section>

      <section className={styles.panel} hidden={tab !== "server"}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>LIVE TRACKING</span><h2>현재 방송</h2></div>
          <span className={styles.pill}>방송 중 {formatInterval(collector?.livePollIntervalMs ?? 0)} 주기</span>
        </div>
        {collector?.active.length ? (
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>채널</th><th>방송 ID</th><th>최근 확인</th><th>상태</th></tr></thead>
              <tbody>{collector.active.map((active) => {
                const streamer = streamers.find((item) => item.channelId === active.channelId);
                return (
                  <tr key={active.channelId}>
                    <td><strong>{streamer?.channelName ?? active.channelId}</strong><small>{active.channelId}</small></td>
                    <td>{active.broadcastId ?? "대기"}</td>
                    <td>{relativeTime(streamer?.lastCheckedAt ?? null, now)}</td>
                    <td><span className={`${styles.status} ${styles.statusLive}`}>추적 중</span></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : <p className={styles.empty}>현재 수집 중인 방송이 없습니다.</p>}
      </section>

      <section className={styles.panel} hidden={tab !== "management"}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>TOP STREAMERS</span><h2>팔로워 상위 50명</h2></div>
          <span className={styles.pill}>순위 기준일 {formatTime(rankingSnapshotAt)}</span>
        </div>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>순위</th><th>채널</th><th>팔로워</th><th>상태</th><th>최근 확인</th><th>다음 확인</th><th>오류</th></tr></thead>
            <tbody>{activeStreamers.map((streamer) => {
              const schedule = scheduleByChannel.get(streamer.channelId);
              return (
                <tr key={streamer.channelId}>
                  <td><strong>#{streamer.trackingRank ?? "-"}</strong></td>
                  <td><strong>{streamer.channelName}</strong><small>{streamer.channelId}</small></td>
                  <td>{streamer.followerCount?.toLocaleString() ?? "확인 중"}</td>
                  <td><span className={`${styles.status} ${streamer.isLive ? styles.statusLive : ""}`}>{streamer.isLive ? "LIVE" : streamer.collectorState}</span></td>
                  <td>{relativeTime(streamer.lastCheckedAt, now)}</td>
                  <td>{relativeFuture(schedule?.nextCheckAt ?? null, now)}</td>
                  <td className={streamer.lastError ? styles.errorText : ""}>
                    {streamer.lastError ? `재시도 ${schedule?.failureCount ?? 0}회` : "없음"}
                    {streamer.lastError && <small>{streamer.lastError}</small>}
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel} hidden={tab !== "logs"}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>RECENT BROADCASTS</span><h2>최근 방송</h2></div>
          <span className={styles.pill}>{rows.broadcastCount}개 기록</span>
        </div>
        <div className={styles.broadcasts}>{broadcasts.slice(0, 12).map((broadcast) => (
          <article key={broadcast.id}>
            <div>
              <span className={`${styles.status} ${broadcast.status === "live" ? styles.statusLive : ""}`}>{broadcast.status}</span>
              <h3>{broadcast.title}</h3>
              <p>{broadcast.channelName} · {formatTime(broadcast.startedAt)}</p>
            </div>
            <dl>
              <div><dt><Radio size={13} />카테고리</dt><dd>{broadcast.category || "미분류"}</dd></div>
              <div><dt><History size={13} />변경</dt><dd>{broadcast.changeCount}</dd></div>
            </dl>
          </article>
        ))}</div>
      </section>

      <section className={styles.panel} hidden={tab !== "server"}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>APPLICATION REQUESTS</span><h2>서버 요청 로그</h2></div>
          <span className={styles.pill}>최근 {system.http.recentRequests.length}건</span>
        </div>
        <div className={`${styles.tableWrap} ${styles.logTable}`}>
          <table>
            <thead><tr><th>시각</th><th>메서드</th><th>경로</th><th>상태</th><th>응답 시간</th></tr></thead>
            <tbody>{system.http.recentRequests.length ? system.http.recentRequests.map((item, index) => (
              <tr key={`${item.at}-${index}`}>
                <td>{formatTime(item.at)}</td>
                <td><strong>{item.method}</strong></td>
                <td><code>{item.route}</code></td>
                <td className={item.statusCode >= 500 ? styles.errorText : ""}>{item.statusCode}</td>
                <td>{Math.round(item.latencyMs)}ms</td>
              </tr>
            )) : <tr><td colSpan={5}>서버 재시작 후 요청 로그를 수집하고 있습니다.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel} hidden={tab !== "server"}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>VERCEL DEPLOYMENT</span><h2><Cloud size={18} /> Vercel 로그</h2></div>
          <span className={styles.pill}>{vercelLogs?.deployment?.state ?? "확인 중"}</span>
        </div>
        {vercelError && <p className={styles.error}>{vercelError}</p>}
        {vercelLogs && !vercelLogs.configured && (
          <p className={styles.empty}>서버에 Vercel API 토큰을 설정하면 최근 운영 배포 로그가 표시됩니다.</p>
        )}
        {vercelLogs?.deployment && (
          <div className={styles.vercelDeployment}>
            <div><strong>{vercelLogs.deployment.name}</strong><small>{vercelLogs.deployment.uid}</small></div>
            <a href={`https://${vercelLogs.deployment.url}`} target="_blank" rel="noreferrer">배포 열기</a>
          </div>
        )}
        {vercelLogs?.configured && (
          <div className={`${styles.tableWrap} ${styles.logTable}`}>
            <table>
              <thead><tr><th>시각</th><th>유형</th><th>요청</th><th>상태</th><th>메시지</th></tr></thead>
              <tbody>{vercelLogs.logs.length ? vercelLogs.logs.map((item) => (
                <tr key={item.id}>
                  <td>{formatTime(item.createdAt)}</td>
                  <td>{item.type}</td>
                  <td><code>{[item.method, item.path].filter(Boolean).join(" ") || "-"}</code></td>
                  <td>{item.statusCode ?? "-"}</td>
                  <td><pre>{item.message || item.region || "-"}</pre></td>
                </tr>
              )) : <tr><td colSpan={5}>최근 운영 배포 로그가 없습니다.</td></tr>}</tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function feedbackLabel(category: string) {
  if (category === "streamer_request") return "스트리머 요청";
  if (category === "bug") return "오류";
  if (category === "idea") return "아이디어";
  if (category === "usability") return "사용성";
  return "기타";
}

export function AdminExperience() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const check = useCallback(() => {
    adminApi("/overview").then(() => setAuthenticated(true)).catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  if (authenticated === null) {
    return <main className={styles.loading}>관리자 세션을 확인하고 있습니다.</main>;
  }
  if (!authenticated) return <Login onSuccess={() => setAuthenticated(true)} />;
  return <Dashboard onUnauthorized={() => setAuthenticated(false)} />;
}
