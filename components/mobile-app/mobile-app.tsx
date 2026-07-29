"use client";

import {
  CircleHelp,
  CloudDownload,
  Heart,
  MessageSquarePlus,
  RefreshCw,
  Settings,
  UsersRound
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { authApi, type AppUser } from "@/lib/auth-api";
import { trackEvent } from "@/lib/analytics";
import type { Streamer } from "@/lib/types";
import { FollowTab } from "./follow-tab";
import { GuideSheet } from "./guide-sheet";
import { OnboardingGate } from "./onboarding-gate";
import { SettingsTab } from "./settings-tab";
import { StreamersTab } from "./streamers-tab";
import { StreamerPickerSheet } from "./streamer-picker-sheet";
import { SuggestionSheet } from "./suggestion-sheet";
import { useMobilePreferences } from "./use-mobile-preferences";
import { PREFERENCE_IMPORT_KEY } from "./use-mobile-preferences";
import { STREAMER_IMPORT_KEY, usePersonalStreamers } from "./use-personal-streamers";
import { usePushLogs } from "./use-push-logs";
import { usePushSubscription } from "./use-push-subscription";
import { usePwaInstall } from "./use-pwa-install";
import styles from "./mobile-app.module.css";

type AppTab = "follow" | "streamers" | "settings";
const TAB_STORAGE_KEY = "gudegi-active-tab";

export function MobileApp({ streamers }: { streamers: Streamer[] }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AppTab>("follow");
  const [guideOpen, setGuideOpen] = useState(false);
  const [suggestionType, setSuggestionType] = useState<"idea" | "streamer_request" | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [entryReady, setEntryReady] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState("");

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
  const user = session.data ?? null;
  const preferences = useMobilePreferences(streamers, user);
  const personal = usePersonalStreamers(streamers, user);
  const pwa = usePwaInstall();
  const push = usePushSubscription(preferences.preferences);
  const pushLogs = usePushLogs();

  const selectedStreamer = useMemo(() => {
    return personal.supportedStreamers.find((streamer) => streamer.channelId === preferences.primaryChannelId)
      ?? personal.supportedStreamers.find((streamer) => streamer.isLive)
      ?? personal.supportedStreamers[0]
      ?? streamers.find((streamer) => streamer.channelId === preferences.primaryChannelId)
      ?? streamers.find((streamer) => streamer.isLive)
      ?? streamers[0];
  }, [personal.supportedStreamers, preferences.primaryChannelId, streamers]);
  const selectedPreference = preferences.preferences.find(
    (preference) => preference.channelId === selectedStreamer?.channelId
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const mode = window.localStorage.getItem("gudegi-entry-mode")
        ?? window.localStorage.getItem("trackline-entry-mode");
      const savedTab = window.localStorage.getItem(TAB_STORAGE_KEY);
      if (savedTab === "follow" || savedTab === "streamers" || savedTab === "settings") {
        setTab(savedTab);
      }
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
          onGuest={() => {
            window.localStorage.setItem("gudegi-entry-mode", "guest");
            setGuestMode(true);
          }}
        />
      </main>
    );
  }

  if (!selectedStreamer || !selectedPreference || !entryReady || !preferences.ready || !personal.ready) {
    return <main className={`${styles.app} mobile-app-shell standalone-route`}><div className={styles.appLoading}><RefreshCw />구데기를 준비하고 있습니다.</div></main>;
  }

  async function startLogin() {
    window.localStorage.setItem(PREFERENCE_IMPORT_KEY, "1");
    window.localStorage.setItem(STREAMER_IMPORT_KEY, "1");
    try {
      const result = await authApi.begin();
      window.location.assign(result.data.authorizationUrl);
    } catch {
      window.location.assign("/login");
    }
  }

  async function logout() {
    setLogoutBusy(true);
    setLogoutMessage("");
    try {
      await authApi.logout();
      window.localStorage.setItem("gudegi-entry-mode", "guest");
      window.localStorage.setItem(TAB_STORAGE_KEY, "settings");
      setGuestMode(true);
      queryClient.setQueryData(["app-session"], null);
      await session.refetch();
      window.location.replace("/");
    } catch {
      setLogoutMessage("로그아웃하지 못했습니다. 네트워크를 확인하고 다시 눌러 주세요.");
    } finally {
      setLogoutBusy(false);
    }
  }

  function selectTab(next: AppTab) {
    setTab(next);
    window.localStorage.setItem(TAB_STORAGE_KEY, next);
  }

  function connectPush() {
    if (!pwa.installed && !push.capable) {
      setGuideOpen(true);
      return;
    }
    void push.enable();
  }

  async function resetAlertList() {
    if (!window.confirm("알림 목록과 스트리머별 알림 설정을 모두 초기화할까요?")) return;
    const currentIds = [...personal.channelIds];
    await preferences.clear(currentIds);
    await personal.clear();
  }

  return (
    <main className={`${styles.app} mobile-app-shell standalone-route`}>
      <header className={styles.appHeader}>
        <div className={styles.brandActions}>
          <button className={styles.logo} aria-label="알림 관리로 이동" onClick={() => selectTab("follow")}><BrandMark className={styles.brandMark} /><span><strong>구데기</strong><small>원하는 방송만 골라보기</small></span></button>
          <button
            className={styles.refreshButton}
            aria-label="새로고침"
            title="새로고침"
            onClick={() => window.location.reload()}
          ><RefreshCw /></button>
        </div>
        <div className={styles.headerActions}>
          {!user && <button className={styles.importButton} onClick={() => void startLogin()}><CloudDownload /><span>팔로우 불러오기</span></button>}
          <button className={styles.suggestButton} onClick={() => setSuggestionType("idea")}><MessageSquarePlus /><span>제안</span></button>
          <button className={styles.guideButton} onClick={() => {
            trackEvent("pwa_guide_opened");
            setGuideOpen(true);
          }}><CircleHelp /><span>사용방법</span></button>
        </div>
      </header>

      <section className={styles.viewport}>
        {tab === "follow" && (
          <FollowTab
            streamers={personal.supportedStreamers}
            preferences={preferences.preferences.filter((item) => personal.channelIds.includes(item.channelId))}
            user={user}
            pushActive={push.active}
            pushBusy={push.connecting}
            pushMessage={push.message}
            onConnect={push.active ? () => selectTab("settings") : connectPush}
            onChange={preferences.updatePreference}
            onChangeAll={(checked) => preferences.updateAll(checked, personal.channelIds)}
            onAdd={() => setPickerOpen(true)}
            onRemove={personal.remove}
            unsupportedRequests={personal.unsupported}
            onSuggest={() => setSuggestionType("streamer_request")}
          />
        )}
        {tab === "streamers" && (
          <StreamersTab
            streamers={streamers}
            selected={selectedStreamer}
            preference={selectedPreference}
            personalChannelIds={personal.channelIds}
            onSelect={preferences.selectPrimary}
            onChange={(key, checked) => preferences.updatePreference(
              selectedStreamer.channelId,
              key,
              checked
            )}
            unsupportedRequests={personal.unsupported}
            onAddToAlerts={personal.add}
            onRemoveFromAlerts={personal.remove}
            onSuggest={() => setSuggestionType("streamer_request")}
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
              item.enabled && item.categoryChanged
            ).length}
            logs={pushLogs.logs}
            logoutBusy={logoutBusy}
            logoutMessage={logoutMessage}
            onEnable={connectPush}
            onDisable={() => void push.disable()}
            onTest={() => void push.test()}
            onGuide={() => setGuideOpen(true)}
            onLogout={() => void logout()}
            onClearLogs={() => void pushLogs.clear()}
            onResetAlerts={() => void resetAlertList()}
          />
        )}
      </section>

      <nav className={styles.bottomNav} aria-label="앱 메뉴">
        <TabButton active={tab === "follow"} onClick={() => selectTab("follow")} icon={<Heart />} label="알림 관리" />
        <TabButton active={tab === "streamers"} onClick={() => selectTab("streamers")} icon={<UsersRound />} label="스트리머" />
        <TabButton active={tab === "settings"} onClick={() => selectTab("settings")} icon={<Settings />} label="설정" badge={push.active} />
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
      {pickerOpen && (
        <StreamerPickerSheet
          streamers={streamers.filter((streamer) => !personal.channelIds.includes(streamer.channelId))}
          selectedChannelId=""
          onSelect={personal.add}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {suggestionType && (
        <SuggestionSheet
          initialType={suggestionType}
          onSubmitted={() => undefined}
          onClose={() => setSuggestionType(null)}
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
