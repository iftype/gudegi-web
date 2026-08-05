export type FeedbackCategory = "streamer_request" | "idea" | "bug" | "usability";
export type FeedbackStatus = "new" | "reviewing" | "resolved" | "archived";

export type FeedbackEntry = {
  id: number;
  category: string;
  message: string;
  contact: string | null;
  status: string;
  createdAt: number;
  updatedAt: number;
  targetChannelId: string | null;
  targetChannelName: string | null;
  requestCount: number;
};

export type Streamer = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
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

export type Broadcast = {
  id: string;
  channelName: string;
  title: string;
  status: string;
  startedAt: number;
  category: string | null;
  changeCount: number;
};

export type Overview = {
  streamers: Streamer[];
  broadcasts: Broadcast[];
  limits: { maxActiveStreamers: number };
  feedback: FeedbackEntry[];
  streamerRequestDemand: Array<{
    channelId: string;
    channelName: string;
    channelImageUrl: string | null;
    requesterCount: number;
    requestCount: number;
    lastRequestedAt: number;
  }>;
  analytics: {
    eventCount: number;
    visitorCount: number;
    returningVisitorCount: number;
    pwaInstalledVisitorCount: number;
    pwaAppOpenVisitorCount: number;
    pwaPromptedVisitorCount: number;
    events: Array<{ eventName: string; eventCount: number; visitorCount: number }>;
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
        nativePushSubscriptionCount: number;
        iosPushSubscriptionCount: number;
        androidPushSubscriptionCount: number;
        nativePushPreferenceCount: number;
        appInstallationCount: number;
        sentNotificationCount: number;
        pendingNotificationCount: number;
        failedNotificationCount: number;
        nativeSentNotificationCount: number;
        nativePendingNotificationCount: number;
        nativeFailedNotificationCount: number;
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
      livePollIntervalMs: number;
      offlinePollIntervalMs: number;
      checksLastMinute: number;
      checksLastHour: number;
      failuresLastHour: number;
      lastCycleCompletedAt: number | null;
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
      routes: Array<{ route: string; calls: number; failures: number; averageLatencyMs: number }>;
    };
    chzzkApi: {
      callsLastMinute: number;
      callsLastHour: number;
      failuresLastHour: number;
      averageLatencyMs: number;
    } | null;
  };
};

export const feedbackCategories: Array<{ key: FeedbackCategory; label: string }> = [
  { key: "streamer_request", label: "스트리머" },
  { key: "idea", label: "아이디어" },
  { key: "bug", label: "오류" },
  { key: "usability", label: "사용성" }
];

export const feedbackStatuses: Array<{ key: FeedbackStatus; label: string }> = [
  { key: "new", label: "접수" },
  { key: "reviewing", label: "확인 중" },
  { key: "resolved", label: "처리 완료" },
  { key: "archived", label: "보관" }
];
