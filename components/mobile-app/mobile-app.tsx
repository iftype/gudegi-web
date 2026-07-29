"use client";

import {
  CircleHelp,
  Heart,
  RefreshCw,
  Settings,
  UsersRound
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { authApi, type AppUser } from "@/lib/auth-api";
import { trackEvent } from "@/lib/analytics";
import type { Streamer } from "@/lib/types";
import { FollowTab } from "./follow-tab";
import { GuideSheet } from "./guide-sheet";
import { OnboardingGate } from "./onboarding-gate";
import { SettingsTab } from "./settings-tab";
import { StreamersTab } from "./streamers-tab";
import { useMobilePreferences } from "./use-mobile-preferences";
import { usePushLogs } from "./use-push-logs";
import { usePushSubscription } from "./use-push-subscription";
import { usePwaInstall } from "./use-pwa-install";
import styles from "./mobile-app.module.css";

type AppTab = "follow" | "streamers" | "settings";

export function MobileApp({ streamers }: { streamers: Streamer[] }) {
  const [tab, setTab] = useState<AppTab>("follow");
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
  const pushLogs = usePushLogs();

  const selectedStreamer = useMemo(() => {
    return streamers.find((streamer) => streamer.channelId === preferences.primaryChannelId)
      ?? streamers.find((streamer) => streamer.isLive)
      ?? streamers[0];
  }, [preferences.primaryChannelId, streamers]);
  const selectedPreference = preferences.preferences.find(
    (preference) => preference.channelId === selectedStreamer?.channelId
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const mode = window.localStorage.getItem("gudegi-entry-mode")
        ?? window.localStorage.getItem("trackline-entry-mode");
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
            window.localStorage.setItem("gudegi-entry-mode", "guest");
            setGuestMode(true);
          }}
        />
      </main>
    );
  }

  if (!selectedStreamer || !selectedPreference || !entryReady || !preferences.ready) {
    return <main className={`${styles.app} mobile-app-shell standalone-route`}><div className={styles.appLoading}><RefreshCw />구데기를 준비하고 있습니다.</div></main>;
  }

  async function startLogin() {
    try {
      const result = await authApi.begin();
      window.location.assign(result.data.authorizationUrl);
    } catch {
      window.location.assign("/login");
    }
  }

  async function logout() {
    await authApi.logout();
    window.localStorage.setItem("gudegi-entry-mode", "guest");
    setGuestMode(true);
    await session.refetch();
  }

  function openStreamer(channelId: string) {
    preferences.selectPrimary(channelId);
    setTab("streamers");
  }

  function connectPush() {
    if (!pwa.installed) {
      setGuideOpen(true);
      return;
    }
    void push.enable();
  }

  return (
    <main className={`${styles.app} mobile-app-shell standalone-route`}>
      <header className={styles.appHeader}>
        <div className={styles.logo}><span>ㄱ</span><div><strong>구데기</strong><small>원하는 방송만 골라보기</small></div></div>
        <button className={styles.guideButton} onClick={() => {
          trackEvent("pwa_guide_opened");
          setGuideOpen(true);
        }}><CircleHelp /><span>사용방법</span></button>
      </header>

      <section className={styles.viewport}>
        {tab === "follow" && (
          <FollowTab
            streamers={streamers}
            preferences={preferences.preferences}
            user={user}
            pushActive={push.active}
            pushBusy={push.connecting}
            pushMessage={push.message}
            onConnect={push.active ? () => setTab("settings") : connectPush}
            onChange={preferences.updatePreference}
            onOpenStreamer={openStreamer}
          />
        )}
        {tab === "streamers" && (
          <StreamersTab
            streamers={streamers}
            selected={selectedStreamer}
            preference={selectedPreference}
            onSelect={preferences.selectPrimary}
            onChange={(key, checked) => preferences.updatePreference(
              selectedStreamer.channelId,
              key,
              checked
            )}
          />
        )}
        {tab === "settings" && (
          <SettingsTab
            user={user}
            installed={pwa.installed}
            pushActive={push.active}
            pushBusy={push.connecting || push.testing}
            pushMessage={push.message}
            permission={push.permission}
            targetCount={preferences.preferences.filter((item) =>
              item.enabled && (item.categoryChanged || item.titleChanged)
            ).length}
            logs={pushLogs.logs}
            onEnable={connectPush}
            onDisable={() => void push.disable()}
            onTest={() => void push.test()}
            onGuide={() => setGuideOpen(true)}
            onLogin={() => void startLogin()}
            onLogout={() => void logout()}
            onClearLogs={() => void pushLogs.clear()}
          />
        )}
      </section>

      <nav className={styles.bottomNav} aria-label="앱 메뉴">
        <TabButton active={tab === "follow"} onClick={() => setTab("follow")} icon={<Heart />} label="팔로우 설정" />
        <TabButton active={tab === "streamers"} onClick={() => setTab("streamers")} icon={<UsersRound />} label="스트리머" />
        <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon={<Settings />} label="설정" badge={push.active} />
      </nav>

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
