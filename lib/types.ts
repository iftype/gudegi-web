export type Streamer = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  enabled: boolean;
  isLive: boolean;
  activeBroadcastId: string | null;
  collectorState: string;
  lastCheckedAt: number | null;
  followerCount?: number | null;
  trackingRank?: number | null;
  rankingSource?: string | null;
  rankingSnapshotAt?: number | null;
  profileCheckedAt?: number | null;
};

export type Broadcast = {
  id: string;
  channelId: string;
  channelName: string;
  channelImageUrl?: string | null;
  title: string;
  category: string | null;
  startedAt: number;
  endedAt: number | null;
  vodUrl: string | null;
  status: "live" | "ended";
  changeCount: number;
  thumbnailUrl?: string | null;
  metadataEvents?: MetadataEvent[];
};

export type MetadataEvent = {
  id: number;
  type: "title" | "category";
  previousValue: string | null;
  newValue: string | null;
  detectedAt: number;
};

export type CalendarBroadcast = {
  id: string;
  title: string;
  category: string | null;
  startedAt: number;
  endedAt: number | null;
  vodUrl: string;
  thumbnailUrl: string | null;
  channelImageUrl: string | null;
};

export type CategoryDuration = {
  category: string;
  durationMs: number;
  percentage: number;
};

export type MonthlyStreamer = {
  month: string;
  timezone: "Asia/Seoul";
  broadcasts: CalendarBroadcast[];
  categoryDurations: CategoryDuration[];
  totalDurationMs: number;
  dayStatuses: Array<{
    date: string;
    status: "broadcast" | "no_broadcast" | "uncollected" | "monitoring";
  }>;
};

export type PushPreference = {
  channelId: string;
  enabled: boolean;
  categoryChanged: boolean;
  titleChanged: boolean;
};
