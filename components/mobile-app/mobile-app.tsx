"use client";

import {
  Activity,
  Bell,
  BellRing,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  Home,
  Info,
  LogIn,
  LogOut,
  Radio,
  RefreshCw,
  ShieldAlert,
  Smartphone
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { authApi, type AppUser } from "@/lib/auth-api";
import { trackEvent } from "@/lib/analytics";
import type { Streamer } from "@/lib/types";
import { CompactCalendar } from "./compact-calendar";
import { GuideSheet } from "./guide-sheet";
import { OnboardingGate } from "./onboarding-gate";
import { StreamerPickerSheet } from "./streamer-picker-sheet";
import { useMobilePreferences } from "./use-mobile-preferences";
import { usePushSubscription } from "./use-push-subscription";
import { usePwaInstall } from "./use-pwa-install";
import styles from "./mobile-app.module.css";

type AppTab = "home" | "calendar" | "alerts";

export function MobileApp({ streamers }: { streamers: Streamer[] }) {
  const [tab, setTab] = useState<AppTab>("home");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [entryReady, setEntryReady] = useState(false);
  const [guestMode, setGuestMode] = useState(false);

  const session = useQuery({
    queryKey: ["app-session"],
    queryFn: async (): Promise<AppUser | null> => {
      try {
        return (await authApi.me()).data.user;
      } catch (error) {
        if (error instanceof Error && error.message === "unauthorized") return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000
  });
  const oauthConfig = useQuery({
    queryKey: ["oauth-config"],
    queryFn: () => authApi.config(),
    staleTime: 10 * 60_000
  });
  const user = session.data ?? null;
  const preferences = useMobilePreferences(streamers, user);
  const pwa = usePwaInstall();
  const push = usePushSubscription(preferences.preferences);

  const selectedStreamer = useMemo(() => {
    return streamers.find((streamer) => streamer.channelId === preferences.primaryChannelId)
      ?? streamers.find((streamer) => streamer.isLive)
      ?? streamers[0];
  }, [preferences.primaryChannelId, streamers]);
  const selectedPreference = preferences.preferences.find(
    (preference) => preference.channelId === selectedStreamer?.channelId
  );
  const broadcast = useQuery({
    queryKey: ["mobile-active-broadcast", selectedStreamer?.activeBroadcastId],
    queryFn: ({ signal }) => api.broadcast(selectedStreamer!.activeBroadcastId!, signal),
    enabled: Boolean(selectedStreamer?.activeBroadcastId),
    refetchInterval: selectedStreamer?.isLive ? 30_000 : false
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const mode = window.localStorage.getItem("trackline-entry-mode");
      setGuestMode(mode === "guest");
      setEntryReady(true);
      if (!mode) trackEvent("onboarding_viewed");
      trackEvent("page_view");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const showOnboarding = entryReady
    && !session.isLoading
    && !user
    && !guestMode;

  if (showOnboarding) {
    return (
      <main className={`${styles.app} mobile-app-shell standalone-route`}>
        <OnboardingGate
          user={user}
          oauthConfigured={oauthConfig.data?.data.configured ?? false}
          onGuest={() => {
            window.localStorage.setItem("trackline-entry-mode", "guest");
            setGuestMode(true);
          }}
        />
      </main>
    );
  }

  if (!selectedStreamer || !entryReady) {
    return <main className={`${styles.app} mobile-app-shell standalone-route`}><div className={styles.appLoading}><RefreshCw />앱을 준비하고 있습니다.</div></main>;
  }

  async function startLogin() {
    try {
      const result = await authApi.begin();
      window.location.assign(result.data.authorizationUrl);
    } catch {
      setGuideOpen(false);
      window.location.assign("/login");
    }
  }

  async function logout() {
    await authApi.logout();
    window.localStorage.setItem("trackline-entry-mode", "guest");
    setGuestMode(true);
    await session.refetch();
  }

  return (
    <main className={`${styles.app} mobile-app-shell standalone-route`}>
      <header className={styles.appHeader}>
        <div className={styles.logo}><Activity /><span>TRACKLINE</span></div>
        <div className={styles.headerActions}>
          <button onClick={() => {
            trackEvent("pwa_guide_opened");
            setGuideOpen(true);
          }}><CircleHelp /><span>사용방법</span></button>
          {user ? (
            <button className={styles.userButton} onClick={() => void logout()} title="로그아웃">
              <span>{user.channelName.slice(0, 1)}</span><LogOut />
            </button>
          ) : (
            <button className={styles.loginButton} onClick={() => void startLogin()}><LogIn /><span>로그인</span></button>
          )}
        </div>
      </header>

      {!user && (
        <div className={styles.guestBanner}>
          <ShieldAlert />
          <span><strong>비로그인 모드</strong> 설정은 이 브라우저에만 저장되며 데이터 삭제 시 복구되지 않습니다.</span>
          <button onClick={() => void startLogin()}>로그인</button>
        </div>
      )}

      <section className={styles.viewport}>
        <button className={styles.streamerButton} onClick={() => {
          trackEvent("streamer_picker_opened");
          setPickerOpen(true);
        }}>
          <span className={styles.selectedAvatar}>
            {selectedStreamer.channelImageUrl
              ? <img src={selectedStreamer.channelImageUrl} alt="" />
              : selectedStreamer.channelName.slice(0, 1)}
            {selectedStreamer.isLive && <i />}
          </span>
          <span>
            <small>선택한 스트리머</small>
            <strong>{selectedStreamer.channelName}</strong>
          </span>
          <span className={styles.rank}>#{selectedStreamer.trackingRank ?? "-"}</span>
          <ChevronDown />
        </button>

        {tab === "home" && (
          <div className={styles.homeView}>
            <section className={`${styles.statusCard} ${selectedStreamer.isLive ? styles.liveCard : ""}`}>
              <div className={styles.statusTop}>
                <span>{selectedStreamer.isLive ? <><Radio /> LIVE TRACKING</> : <><Activity /> OFFLINE</>}</span>
                <small>{selectedStreamer.lastCheckedAt
                  ? `${new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(selectedStreamer.lastCheckedAt)} 확인`
                  : "확인 대기"}</small>
              </div>
              <div className={styles.statusMain}>
                <span className={styles.largeAvatar}>
                  {selectedStreamer.channelImageUrl
                    ? <img src={selectedStreamer.channelImageUrl} alt="" />
                    : selectedStreamer.channelName.slice(0, 1)}
                </span>
                <div>
                  <h1>{selectedStreamer.channelName}</h1>
                  <p>{(selectedStreamer.followerCount ?? 0).toLocaleString()} 팔로워</p>
                </div>
              </div>
              <div className={styles.liveMetadata}>
                <div><span>현재 카테고리</span><strong>{broadcast.data?.data.category ?? (selectedStreamer.isLive ? "확인 중" : "방송 전")}</strong></div>
                <div><span>현재 방제</span><strong>{broadcast.data?.data.title ?? (selectedStreamer.isLive ? "불러오는 중" : "방송을 시작하면 표시됩니다")}</strong></div>
              </div>
              <a href={`https://chzzk.naver.com/${selectedStreamer.channelId}`} target="_blank" rel="noreferrer">
                치지직에서 보기 <ExternalLink />
              </a>
            </section>
            <section className={styles.quickGrid}>
              <button onClick={() => setTab("alerts")}>
                <span className={push.active ? styles.quickActive : ""}><BellRing /></span>
                <strong>{push.active ? "알림 사용 중" : "알림 설정"}</strong>
                <small>{selectedPreference?.enabled ? "변경 항목 선택됨" : "스트리머를 선택하세요"}</small>
              </button>
              <button onClick={() => setTab("calendar")}>
                <span><CalendarDays /></span>
                <strong>방송 달력</strong>
                <small>다시보기 날짜 확인</small>
              </button>
            </section>
            <div className={styles.serviceNote}><Info /> 방송 중 1분 · 오프라인 5분 주기로 변경을 확인합니다.</div>
          </div>
        )}

        {tab === "calendar" && <CompactCalendar streamer={selectedStreamer} />}

        {tab === "alerts" && (
          <div className={styles.alertView}>
            <header><span>CHANGE ALERT</span><h1>어떤 변경을 알려드릴까요?</h1><p>{selectedStreamer.channelName} 방송에서 원하는 항목만 선택하세요.</p></header>
            <div className={styles.alertOptions}>
              <SwitchRow
                icon={<Check />}
                title="이 스트리머 알림"
                description="알림 대상에 포함"
                checked={selectedPreference?.enabled ?? false}
                onChange={(checked) => preferences.updatePreference(selectedStreamer.channelId, "enabled", checked)}
              />
              <SwitchRow
                icon={<RefreshCw />}
                title="카테고리 변경"
                description="게임이나 방송 분류가 바뀔 때"
                checked={selectedPreference?.categoryChanged ?? false}
                disabled={!selectedPreference?.enabled}
                onChange={(checked) => preferences.updatePreference(selectedStreamer.channelId, "categoryChanged", checked)}
              />
              <SwitchRow
                icon={<Activity />}
                title="방제 변경"
                description="방송 제목이 바뀔 때"
                checked={selectedPreference?.titleChanged ?? false}
                disabled={!selectedPreference?.enabled}
                onChange={(checked) => preferences.updatePreference(selectedStreamer.channelId, "titleChanged", checked)}
              />
            </div>
            <div className={`${styles.installGate} ${pwa.installed ? styles.installed : ""}`}>
              <span>{pwa.installed ? <Smartphone /> : <ShieldAlert />}</span>
              <div>
                <strong>{pwa.installed ? "PWA 앱으로 실행 중" : "앱 설치가 먼저 필요해요"}</strong>
                <p>{pwa.installed ? "이제 이 기기에서 알림 권한을 켤 수 있습니다." : "홈 화면에 설치한 앱에서만 알림 설정을 허용합니다."}</p>
              </div>
            </div>
            <button
              className={styles.alertAction}
              onClick={() => {
                if (!pwa.installed) {
                  setGuideOpen(true);
                  return;
                }
                void (push.active ? push.disable() : push.enable());
              }}
            >
              {push.active ? <Bell /> : pwa.installed ? <BellRing /> : <Smartphone />}
              {push.active ? "이 기기 알림 끄기" : pwa.installed ? "이 기기 알림 켜기" : "설치 방법 보기"}
            </button>
            <p className={styles.alertMessage}>{push.message || (
              preferences.saveState === "saving"
                ? "설정을 저장하는 중…"
                : user
                  ? "선택 항목은 로그인 계정에 저장됩니다."
                  : "선택 항목은 이 브라우저에만 저장됩니다."
            )}</p>
          </div>
        )}
      </section>

      <nav className={styles.bottomNav} aria-label="앱 메뉴">
        <TabButton active={tab === "home"} onClick={() => setTab("home")} icon={<Home />} label="홈" />
        <TabButton active={tab === "calendar"} onClick={() => setTab("calendar")} icon={<CalendarDays />} label="달력" />
        <TabButton active={tab === "alerts"} onClick={() => setTab("alerts")} icon={<Bell />} label="알림" badge={push.active} />
      </nav>

      {pickerOpen && (
        <StreamerPickerSheet
          streamers={streamers}
          selectedChannelId={selectedStreamer.channelId}
          onSelect={preferences.selectPrimary}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {guideOpen && (
        <GuideSheet
          initialPlatform={pwa.platform}
          canPrompt={pwa.canPrompt}
          installed={pwa.installed}
          onInstall={pwa.install}
          onClose={() => setGuideOpen(false)}
        />
      )}
    </main>
  );
}

function SwitchRow({
  icon,
  title,
  description,
  checked,
  disabled,
  onChange
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={disabled ? styles.switchDisabled : ""}>
      <span className={styles.switchIcon}>{icon}</span>
      <span><strong>{title}</strong><small>{description}</small></span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <i />
    </label>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: boolean;
}) {
  return <button className={active ? styles.navActive : ""} onClick={onClick}>{icon}{badge && <i />}<span>{label}</span></button>;
}
