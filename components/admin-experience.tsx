"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  Database,
  HardDrive,
  LogOut,
  MemoryStick,
  MessageCircle,
  Radio,
  RefreshCw,
  Server
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
};

type Broadcast = {
  id: string;
  channelName: string;
  title: string;
  status: string;
  startedAt: number;
  chatCount: number;
  burstCount: number;
};

type ActiveCollector = {
  channelId: string;
  broadcastId: string;
  bufferedTimelineBuckets: number;
  bufferedMessageWindows: number;
  lastMessageAt: number | null;
  lastSnapshotAt: number | null;
  gapOpen: boolean;
};

type Overview = {
  streamers: Streamer[];
  broadcasts: Broadcast[];
  keywordRules: Array<{ id: number; channelId: string; keyword: string }>;
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
        timelineBucketCount: number;
        messageCount: number;
        messageWindowCount: number;
        latestTimelineBucketAt: number | null;
        latestMessageAt: number | null;
        latestMessageWindowAt: number | null;
        openGapCount: number;
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
      activeCount: number;
      maxActiveStreamers: number;
      pollIntervalMs: number;
      liveMessageSnapshotMs: number;
      messageRetentionDays: number;
      active: ActiveCollector[];
    } | null;
  };
};

async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: { "content-type": "application/json", ...init?.headers }
  });
  if (!response.ok) {
    throw new Error(response.status === 401 ? "unauthorized" : "request_failed");
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
        <p>서버 상태와 채팅 저장 흐름을 확인합니다.</p>
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

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 15_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  if (!overview) {
    return <main className={styles.loading}>{error || "서버 상태를 확인하고 있습니다."}</main>;
  }

  const { system, streamers, broadcasts } = overview;
  const now = system.generatedAt;
  const rows = system.database.rows;
  const collector = system.collector;
  const hostMemoryUsed = system.host.totalMemoryBytes - system.host.freeMemoryBytes;
  const sqliteBytes = system.database.sqlite.databaseBytes
    + system.database.sqlite.walBytes
    + system.database.sqlite.sharedMemoryBytes;
  const latestMessageAge = rows.latestMessageAt ? now - rows.latestMessageAt : Number.POSITIVE_INFINITY;
  const collectionHealthy = Boolean(
    collector?.running
    && rows.openGapCount === 0
    && (collector.activeCount === 0 || latestMessageAge < 120_000)
  );

  async function addStreamer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await adminApi("/streamers", {
        method: "POST",
        body: JSON.stringify({ channelId: form.get("channelId") })
      });
      event.currentTarget.reset();
      await load();
    } catch {
      setError("채널을 등록하지 못했습니다. 32자리 채널 ID를 확인해 주세요.");
    }
  }

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

      <section className={styles.metrics}>
        <article>
          <span><Activity size={15} />수집 상태</span>
          <strong className={collectionHealthy ? styles.good : styles.warn}>
            {collectionHealthy ? "정상" : "확인 필요"}
          </strong>
          <small>{collector?.activeCount ?? 0}/{collector?.maxActiveStreamers ?? 0}개 방송 연결</small>
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

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>DATA FRESHNESS</span><h2>저장 상태</h2></div>
          <span className={styles.pill}>채팅 {collector?.messageRetentionDays ?? 0}일 보관 · 가동 {Math.floor(system.uptimeSeconds / 3600)}시간</span>
        </div>
        <div className={styles.freshnessGrid}>
          <article><span>마지막 타임라인</span><strong>{relativeTime(rows.latestTimelineBucketAt, now)}</strong><small>{formatTime(rows.latestTimelineBucketAt)}</small></article>
          <article><span>마지막 상위 채팅</span><strong>{relativeTime(rows.latestMessageAt, now)}</strong><small>{formatTime(rows.latestMessageAt)}</small></article>
          <article><span>5분 채팅 구간</span><strong>{rows.messageWindowCount.toLocaleString()}</strong><small>문구 {rows.messageCount.toLocaleString()}개</small></article>
          <article><span>연결 공백</span><strong className={rows.openGapCount ? styles.warn : styles.good}>{rows.openGapCount}</strong><small>현재 열려 있는 수집 공백</small></article>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>LIVE COLLECTORS</span><h2>실시간 수집</h2></div>
          <span className={styles.pill}>상위 채팅 {Math.round((collector?.liveMessageSnapshotMs ?? 0) / 1000)}초 갱신</span>
        </div>
        {collector?.active.length ? (
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>채널</th><th>최근 채팅</th><th>최근 저장</th><th>버퍼</th><th>연결</th></tr></thead>
              <tbody>{collector.active.map((active) => {
                const streamer = streamers.find((item) => item.channelId === active.channelId);
                return (
                  <tr key={active.channelId}>
                    <td><strong>{streamer?.channelName ?? active.channelId}</strong><small>{active.broadcastId}</small></td>
                    <td>{relativeTime(active.lastMessageAt, now)}</td>
                    <td>{relativeTime(active.lastSnapshotAt, now)}</td>
                    <td>{active.bufferedTimelineBuckets} / {active.bufferedMessageWindows}</td>
                    <td><span className={`${styles.status} ${active.gapOpen ? styles.statusWarn : styles.statusLive}`}>{active.gapOpen ? "공백" : "연결됨"}</span></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : <p className={styles.empty}>현재 수집 중인 방송이 없습니다.</p>}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div><span className={styles.eyebrow}>STREAMERS</span><h2>등록 채널</h2></div>
          <form className={styles.inlineForm} onSubmit={addStreamer}>
            <input name="channelId" placeholder="32자리 채널 ID" pattern="[a-f0-9]{32}" required />
            <button>채널 등록</button>
          </form>
        </div>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>채널</th><th>상태</th><th>최근 확인</th><th>수집 설정</th></tr></thead>
            <tbody>{streamers.map((streamer) => (
              <tr key={streamer.channelId}>
                <td><strong>{streamer.channelName}</strong><small>{streamer.channelId}</small></td>
                <td><span className={`${styles.status} ${streamer.isLive ? styles.statusLive : ""}`}>{streamer.isLive ? "LIVE" : streamer.collectorState}</span></td>
                <td>{relativeTime(streamer.lastCheckedAt, now)}{streamer.lastError && <small className={styles.errorText}>{streamer.lastError}</small>}</td>
                <td><button className={styles.toggle} aria-pressed={streamer.enabled} onClick={async () => {
                  await adminApi(`/streamers/${streamer.channelId}`, {
                    method: "PATCH",
                    body: JSON.stringify({ enabled: !streamer.enabled })
                  });
                  await load();
                }}>{streamer.enabled ? "켜짐" : "꺼짐"}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel}>
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
              <div><dt><MessageCircle size={13} />채팅</dt><dd>{Number(broadcast.chatCount).toLocaleString()}</dd></div>
              <div><dt><Radio size={13} />급증</dt><dd>{broadcast.burstCount}</dd></div>
            </dl>
          </article>
        ))}</div>
      </section>
    </main>
  );
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
