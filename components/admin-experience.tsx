"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LayoutDashboard, LogOut, MessagesSquare, RefreshCw, Server, Users } from "lucide-react";
import styles from "@/app/admin/admin.module.css";
import { AdminApiError, adminApi, formatTime } from "./admin/api";
import { FeedbackInbox } from "./admin/feedback-inbox";
import { OverviewDashboard } from "./admin/overview-dashboard";
import { ServerDashboard } from "./admin/server-dashboard";
import { StreamerManager } from "./admin/streamer-manager";
import type { Overview } from "./admin/types";

type AdminTab = "overview" | "feedback" | "streamers" | "server";

const tabs: Array<{ key: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
  { key: "overview", label: "현황", icon: LayoutDashboard },
  { key: "feedback", label: "제안함", icon: MessagesSquare },
  { key: "streamers", label: "스트리머", icon: Users },
  { key: "server", label: "서버", icon: Server }
];

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
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") })
      });
      onSuccess();
    } catch {
      setError("로그인 정보를 확인해 주세요. 5회 실패하면 5분간 제한됩니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return <main className={styles.loginShell}>
    <form className={styles.loginCard} onSubmit={submit}>
      <div className={styles.loginMark}>구</div>
      <div><span className={styles.eyebrow}>GUDEGI ADMIN</span><h1>운영 관리</h1><p>앱 제안과 추적 스트리머를 관리합니다.</p></div>
      <label>아이디<input name="username" defaultValue="admin" autoComplete="username" required /></label>
      <label>비밀번호<input name="password" type="password" autoComplete="current-password" required /></label>
      {error && <div className={styles.errorBanner}>{error}</div>}
      <button disabled={submitting}>{submitting ? "확인 중…" : "로그인"}</button>
    </form>
  </main>;
}

function Dashboard({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ message: string; kind: "success" | "error" } | null>(null);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const result = await adminApi<{ data: Overview }>("/overview");
      setOverview(result.data);
      setError("");
    } catch (caught) {
      if (caught instanceof AdminApiError && caught.status === 401) {
        onUnauthorized();
        return;
      }
      setError("운영 정보를 불러오지 못했습니다.");
    } finally {
      if (manual) setRefreshing(false);
    }
  }, [onUnauthorized]);

  const showNotice = useCallback((message: string, kind: "success" | "error" = "success") => {
    setNotice({ message, kind });
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 15_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3_500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!overview) return <main className={styles.loading}>{error || "운영 정보를 확인하고 있습니다."}</main>;

  return <main className={styles.shell}>
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>구</span>
        <div><span className={styles.eyebrow}>GUDEGI OPERATIONS</span><h1>운영 관리</h1><p>마지막 확인 {formatTime(overview.system.generatedAt)}</p></div>
      </div>
      <div className={styles.headerActions}>
        <button className={styles.secondaryButton} onClick={() => void load(true)}>
          <RefreshCw className={refreshing ? styles.spinning : ""} size={15} />새로고침
        </button>
        <button className={styles.secondaryButton} onClick={async () => {
          await adminApi("/session", { method: "DELETE" });
          onUnauthorized();
        }}><LogOut size={15} />로그아웃</button>
      </div>
    </header>

    {error && <div className={styles.errorBanner}>{error}</div>}
    {notice && <div className={`${styles.toast} ${notice.kind === "error" ? styles.toastError : ""}`}>{notice.message}</div>}

    <nav className={styles.primaryNav} aria-label="관리 메뉴">
      {tabs.map((item) => {
        const Icon = item.icon;
        const pending = item.key === "feedback"
          ? overview.feedback.filter((entry) => entry.status === "new" || entry.status === "reviewing").length
          : 0;
        return <button className={tab === item.key ? styles.primaryNavActive : ""} key={item.key} onClick={() => setTab(item.key)}>
          <Icon size={16} /><span>{item.label}</span>{pending > 0 && <strong>{pending}</strong>}
        </button>;
      })}
    </nav>

    {tab === "overview" && <OverviewDashboard
      overview={overview}
      onOpenFeedback={() => setTab("feedback")}
      onOpenStreamers={() => setTab("streamers")}
    />}
    {tab === "feedback" && <FeedbackInbox overview={overview} onReload={load} onNotice={showNotice} />}
    {tab === "streamers" && <StreamerManager overview={overview} onReload={load} onNotice={showNotice} />}
    {tab === "server" && <ServerDashboard overview={overview} />}
  </main>;
}

export function AdminExperience() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const check = useCallback(() => {
    adminApi("/overview").then(() => setAuthenticated(true)).catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  if (authenticated === null) return <main className={styles.loading}>관리자 세션을 확인하고 있습니다.</main>;
  if (!authenticated) return <Login onSuccess={() => setAuthenticated(true)} />;
  return <Dashboard onUnauthorized={() => setAuthenticated(false)} />;
}
