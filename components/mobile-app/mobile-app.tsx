"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
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
import { api } from "@/lib/api";
import type { Streamer } from "@/lib/types";
import { FollowTab } from "./follow-tab";
import { GuideSheet } from "./guide-sheet";
import { OnboardingGate } from "./onboarding-gate";
import { SettingsTab } from "./settings-tab";
import { StreamersTab } from "./streamers-tab";
import { SuggestionSheet } from "./suggestion-sheet";
import { useMobilePreferences } from "./use-mobile-preferences";
import { PREFERENCE_IMPORT_KEY } from "./use-mobile-preferences";
import { STREAMER_IMPORT_KEY, usePersonalStreamers } from "./use-personal-streamers";
import { usePushLogs } from "./use-push-logs";
import { usePushSubscription } from "./use-push-subscription";
import { usePwaInstall } from "./use-pwa-install";
import styles from "./mobile-app-chzzk-v7.module.css";

type AppTab = "follow" | "streamers" | "settings";
type PushNotice = {
  kind: "toast" | "dialog";
  message: string;
  title: string;
  showGuide: boolean;
};
const TAB_STORAGE_KEY = "gudegi-active-tab";
const GUIDE_PENDING_KEY = "gudegi-open-install-guide";
const GUIDE_SEEN_KEY = "gudegi-install-guide-seen";

export function MobileApp({ streamers }: { streamers: Streamer[] }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AppTab>("follow");
  const [guideOpen, setGuideOpen] = useState(false);
  const [suggestionType, setSuggestionType] = useState<"idea" | "streamer_request" | null>(null);
  const [entryReady, setEntryReady] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState("");
  const [dismissedPushMessage, setDismissedPushMessage] = useState("");
  const [streamerDetailChannelId, setStreamerDetailChannelId] = useState<string | null>(null);

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
  const categories = useQuery({
    queryKey: ["live-categories"],
    queryFn: ({ signal }) => api.categories(signal),
    staleTime: 6 * 60 * 60_000,
    retry: 1
  });
  const pwa = usePwaInstall();
  const push = usePushSubscription(preferences.preferences);
  const clearPushMessage = push.clearMessage;
  const pushMessage = push.message;
  const pushConnecting = push.connecting;
  const pushTesting = push.testing;
  const pushLogs = usePushLogs();
  const pushNotice = pushMessage
    && pushMessage !== dismissedPushMessage
    && !pushConnecting
    && !pushTesting
    ? createPushNotice(pushMessage)
    : null;

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
      if (window.localStorage.getItem(GUIDE_PENDING_KEY) === "1") {
        window.localStorage.removeItem(GUIDE_PENDING_KEY);
        window.localStorage.setItem(TAB_STORAGE_KEY, "settings");
        setTab("settings");
        setGuideOpen(true);
      }
      setGuestMode(mode === "guest");
      setEntryReady(true);
      if (!mode) trackEvent("onboarding_viewed");
      trackEvent("page_view");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (
      !pushMessage
      || pushMessage === dismissedPushMessage
      || pushConnecting
      || pushTesting
    ) return;
    const notice = createPushNotice(pushMessage);
    if (notice.kind !== "toast") return;
    const currentMessage = pushMessage;
    const timer = window.setTimeout(() => {
      setDismissedPushMessage(currentMessage);
      clearPushMessage();
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [
    dismissedPushMessage,
    clearPushMessage,
    pushConnecting,
    pushMessage,
    pushTesting
  ]);

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
            window.localStorage.setItem(TAB_STORAGE_KEY, "settings");
            window.localStorage.setItem(GUIDE_SEEN_KEY, "1");
            setTab("settings");
            setGuideOpen(true);
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
    window.localStorage.setItem("gudegi-entry-mode", "guest");
    window.localStorage.setItem(TAB_STORAGE_KEY, "settings");
    setGuestMode(true);
    setTab("settings");
    queryClient.setQueryData(["app-session"], null);
    try {
      await authApi.logout();
      queryClient.clear();
      window.location.replace(`/?logged_out=${Date.now()}`);
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

  async function removeFromAlerts(channelId: string) {
    await preferences.clear([channelId]);
    personal.remove(channelId);
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
            categories={categories.data?.data ?? []}
            onConnect={push.active ? () => selectTab("settings") : connectPush}
            onChange={preferences.updatePreference}
            onChangeAll={(checked) => preferences.updateAll(checked, personal.channelIds)}
            onCategoryFilterChange={(channelId, value) =>
              void preferences.updateCategoryFilter(channelId, value)}
            onCategoryFilterChangeAll={(value) =>
              void preferences.updateCategoryFilterAll(personal.channelIds, value)}
            onKeywordsChange={(channelId, keywords) =>
              void preferences.updateKeywords(channelId, keywords)}
            onAdd={() => selectTab("streamers")}
            onImport={() => void startLogin()}
            onClearAll={() => void resetAlertList()}
            onRemove={(channelId) => void removeFromAlerts(channelId)}
            unsupportedRequests={personal.unsupported}
            onSuggest={() => setSuggestionType("streamer_request")}
            onSuggestUnsupported={async (streamerName) => {
              await api.submitFeedback({ category: "streamer_request", streamerName });
            }}
            onOpenDetail={(channelId) => {
              preferences.selectPrimary(channelId);
              setStreamerDetailChannelId(channelId);
              selectTab("streamers");
            }}
          />
        )}
        {tab === "streamers" && (
          <StreamersTab
            streamers={streamers}
            selected={selectedStreamer}
            personalChannelIds={personal.channelIds}
            onSelect={preferences.selectPrimary}
            unsupportedRequests={personal.unsupported}
            onAddToAlerts={(channelId) => {
              personal.add(channelId);
              void preferences.enableNewStreamer(channelId);
            }}
            onRemoveFromAlerts={(channelId) => void removeFromAlerts(channelId)}
            onSuggest={() => setSuggestionType("streamer_request")}
            onSuggestUnsupported={async (streamerName) => {
              await api.submitFeedback({ category: "streamer_request", streamerName });
            }}
            openDetail={streamerDetailChannelId === selectedStreamer.channelId}
            onCloseDetail={() => setStreamerDetailChannelId(null)}
          />
        )}
        {tab === "settings" && (
          <SettingsTab
            user={user}
            installed={pwa.installed}
            pushActive={push.active}
            pushBusy={push.connecting || push.testing}
            permission={push.permission}
            targetCount={preferences.preferences.filter((item) =>
              item.enabled && (
                item.liveStarted
                || item.categoryChanged
                || item.titleChanged
                || item.keywords.length > 0
              )
            ).length}
            logs={pushLogs.logs}
            logoutBusy={logoutBusy}
            logoutMessage={logoutMessage}
            onEnable={connectPush}
            onDisable={() => void push.disable()}
            onTest={() => void push.test()}
            onGuide={() => setGuideOpen(true)}
            onFeedback={() => setSuggestionType("idea")}
            onLogout={() => void logout()}
            onClearLogs={() => void pushLogs.clear()}
            onResetAlerts={() => void resetAlertList()}
          />
        )}
      </section>

      <nav className={styles.bottomNav} aria-label="앱 메뉴">
        <TabButton active={tab === "follow"} onClick={() => selectTab("follow")} icon={<Heart />} label="알림 관리" />
        <TabButton active={tab === "streamers"} onClick={() => {
          setStreamerDetailChannelId(null);
          selectTab("streamers");
        }} icon={<UsersRound />} label="스트리머" />
        <TabButton active={tab === "settings"} onClick={() => selectTab("settings")} icon={<Settings />} label="설정" badge={push.active} />
      </nav>

      {pushNotice && (
        <PushFeedback
          notice={pushNotice}
          onClose={() => {
            setDismissedPushMessage(pushNotice.message);
            clearPushMessage();
          }}
          onGuide={() => {
            setDismissedPushMessage(pushNotice.message);
            clearPushMessage();
            setGuideOpen(true);
          }}
        />
      )}

      {guideOpen && (
        <GuideSheet
          initialPlatform={pwa.platform}
          canPrompt={pwa.canPrompt}
          installed={pwa.installed}
          onInstall={pwa.install}
          onEnable={connectPush}
          onClose={() => {
            window.localStorage.setItem(GUIDE_SEEN_KEY, "1");
            setGuideOpen(false);
          }}
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

function PushFeedback({
  notice,
  onClose,
  onGuide
}: {
  notice: PushNotice;
  onClose: () => void;
  onGuide: () => void;
}) {
  if (notice.kind === "toast") {
    return (
      <div className={styles.pushToast} role="status" aria-live="polite">
        <CheckCircle2 />
        <span>{notice.message}</span>
      </div>
    );
  }
  return (
    <div className={styles.pushNoticeBackdrop} role="presentation">
      <section className={styles.pushNoticeDialog} role="dialog" aria-modal="true" aria-label={notice.title}>
        <span><AlertTriangle /></span>
        <strong>{notice.title}</strong>
        <p>{notice.message}</p>
        <div className={styles.pushNoticeActions}>
          {notice.showGuide && <button onClick={onGuide}>설치 방법</button>}
          <button className={styles.pushNoticePrimary} onClick={onClose}>확인</button>
        </div>
      </section>
    </div>
  );
}

export function createPushNotice(message: string): PushNotice {
  const success = message.includes("연결됐습니다")
    || message.includes("보냈습니다")
    || message.includes("알림을 껐습니다");
  if (success) {
    return { kind: "toast", message, title: "완료", showGuide: false };
  }
  const permissionRelated = message.includes("권한") || message.includes("허용");
  return {
    kind: "dialog",
    message,
    title: permissionRelated ? "알림 권한을 확인해 주세요" : "알림 연결을 확인해 주세요",
    showGuide: message.includes("설치") || message.includes("PWA") || message.includes("브라우저")
  };
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
