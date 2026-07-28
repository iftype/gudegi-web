"use client";

import Link from "next/link";
import { ArrowLeft, Radio } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { VirtualBroadcastList } from "./virtual-broadcast-list";

export function StreamerExperience({ channelId }: { channelId: string }) {
  const streamers = useQuery({ queryKey: ["streamers"], queryFn: ({ signal }) => api.streamers(signal) });
  const broadcasts = useQuery({
    queryKey: ["streamer-broadcasts", channelId],
    queryFn: ({ signal }) => api.streamerBroadcasts(channelId, signal),
    refetchInterval: 15_000
  });
  const streamer = streamers.data?.data.find((item) => item.channelId === channelId);

  return (
    <main className="page-shell">
      <Link href="/" className="back-link"><ArrowLeft size={16} /> 전체 방송</Link>
      <section className="streamer-hero">
        <div className="avatar large">{streamer?.channelImageUrl ? <img src={streamer.channelImageUrl} alt="" /> : streamer?.channelName.slice(0, 1) ?? "?"}</div>
        <div><span className="kicker">STREAMER ARCHIVE</span><h1>{streamer?.channelName ?? "채널 기록"}</h1><p>방송별 카테고리와 방제 변경 기록입니다.</p></div>
        {streamer?.isLive && <span className="live-badge"><span /> LIVE</span>}
      </section>
      <section className="content-section compact">
        <div className="section-heading"><h2>방송 기록</h2><span className="section-count">{broadcasts.data?.data.length ?? 0} RECORDS</span></div>
        {broadcasts.data?.data.length ? <VirtualBroadcastList broadcasts={broadcasts.data.data} /> : (
          <div className="empty-card"><Radio /><div><h3>아직 기록된 방송이 없어요.</h3><p>방송이 시작되면 카테고리와 방제 추적을 시작합니다.</p></div></div>
        )}
      </section>
    </main>
  );
}
