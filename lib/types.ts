export type Streamer = {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  enabled: boolean;
  isLive: boolean;
  activeBroadcastId: string | null;
  collectorState: string;
  lastCheckedAt: number | null;
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
  chatCount: number;
  burstCount: number;
  gaps?: Gap[];
};

export type TimelineBucket = {
  bucketStart: number;
  totalCount: number;
  distinctEstimate: number;
  isBurst: boolean;
  burstScore: number;
  bucketId: number;
};

export type RepresentativeMessage = {
  id: number;
  content: string;
  occurrences: number;
  reason: "reservoir" | "repeated" | "keyword";
  messageTime: number;
  bucketStart: number;
};

export type Gap = {
  id: number;
  reason: string;
  startedAt: number;
  endedAt: number | null;
};
