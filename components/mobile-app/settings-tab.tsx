"use client";

import {
  Bell,
  BellOff,
  CheckCircle2,
  CircleHelp,
  LogOut,
  MessageSquareText,
  RefreshCw,
  Send,
  Smartphone,
  Trash2
} from "lucide-react";
import type { AppUser } from "@/lib/auth-api";
import type { PushLogEntry } from "@/lib/push-log";
import styles from "./mobile-app.module.css";

export function SettingsTab({
  user,
  installed,
  pushActive,
  pushBusy,
  pushMessage,
  permission,
  targetCount,
  logs,
  logoutBusy,
  logoutMessage,
  onEnable,
  onDisable,
  onTest,
  onGuide,
  onLogout,
  onClearLogs
}: {
  user: AppUser | null;
  installed: boolean;
  pushActive: boolean;
  pushBusy: boolean;
  pushMessage: string;
  permission: NotificationPermission | "unsupported";
  targetCount: number;
  logs: PushLogEntry[];
  logoutBusy: boolean;
  logoutMessage: string;
  onEnable: () => void;
  onDisable: () => void;
  onTest: () => void;
  onGuide: () => void;
  onLogout: () => void;
  onClearLogs: () => void;
}) {
  return (
    <section className={styles.tabScroll}>
      <header className={styles.tabIntro}>
        <span>DEVICE & ACCOUNT</span>
        <h1>설정</h1>
        <p>이 기기의 알림 상태를 확인하고 실제 푸시를 시험해 보세요.</p>
      </header>

      <article className={styles.deviceCard}>
        <div className={styles.deviceHeading}>
          <span>{pushActive ? <CheckCircle2 /> : <Smartphone />}</span>
          <div>
            <strong>{pushActive ? "알림 연결됨" : installed ? "알림 연결 대기" : "앱 설치 필요"}</strong>
            <small>{pushActive
              ? `${permissionLabel(permission)} · 알림 대상 ${targetCount}명`
              : "홈 화면 앱에서 알림을 연결해 주세요."}</small>
          </div>
        </div>
        <div className={styles.deviceActions}>
          <button
            className={styles.primarySettingAction}
            disabled={pushBusy}
            onClick={pushActive ? onTest : installed ? onEnable : onGuide}
          >
            {pushBusy ? <RefreshCw className={styles.spinning} /> : pushActive ? <Send /> : <Bell />}
            {pushBusy ? "처리 중" : pushActive ? "테스트 알림" : installed ? "알림 켜기" : "설치 방법"}
          </button>
          {pushActive && <button onClick={onDisable}><BellOff />알림 끄기</button>}
        </div>
        {pushMessage && <p className={styles.settingMessage}>{pushMessage}</p>}
      </article>

      <article className={styles.accountCard}>
        <div>
          <strong>{user ? user.channelName : "비로그인 사용 중"}</strong>
          <small>{user ? "선택한 스트리머를 계정에 저장합니다." : "설정은 현재 브라우저에만 남습니다."}</small>
        </div>
        {user && (
          <button disabled={logoutBusy} onClick={onLogout}>
            {logoutBusy ? <RefreshCw className={styles.spinning} /> : <LogOut />}
            {logoutBusy ? "로그아웃 중" : "로그아웃"}
          </button>
        )}
      </article>
      {logoutMessage && <p className={styles.accountMessage}>{logoutMessage}</p>}

      <section className={styles.notificationLog}>
        <header>
          <div><MessageSquareText /><strong>받은 알림 로그</strong></div>
          {logs.length > 0 && <button onClick={onClearLogs}><Trash2 />비우기</button>}
        </header>
        <div>
          {logs.map((log) => (
            <article key={log.id}>
              <span>{new Intl.DateTimeFormat("ko-KR", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
              }).format(log.receivedAt)}</span>
              <strong>{log.title}</strong>
              <p>{log.body}</p>
            </article>
          ))}
          {!logs.length && <p className={styles.emptyLog}>아직 이 기기로 받은 알림이 없습니다.</p>}
        </div>
      </section>

      <div className={styles.settingLinks}>
        <button onClick={onGuide}><CircleHelp />설치 및 사용 방법</button>
        <a href="/feedback"><MessageSquareText />피드백 보내기</a>
      </div>
    </section>
  );
}

function permissionLabel(permission: NotificationPermission | "unsupported") {
  if (permission === "granted") return "휴대폰 권한 허용됨";
  if (permission === "denied") return "휴대폰 권한 차단됨";
  if (permission === "default") return "휴대폰 권한 확인 필요";
  return "푸시 미지원 브라우저";
}
