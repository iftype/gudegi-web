"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Clock3, ExternalLink, History, Radio, Tag, TriangleAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate, formatDuration } from "@/lib/format";

export function BroadcastExperience({ broadcastId }: { broadcastId: string }) {
  const broadcast = useQuery({
    queryKey: ["broadcast", broadcastId],
    queryFn: ({ signal }) => api.broadcast(broadcastId, signal),
    refetchInterval: (query) => query.state.data?.data.status === "live" ? 15_000 : false
  });
  const item = broadcast.data?.data;

  if (broadcast.isLoading) return <main className="detail-loading">변경 기록을 불러오고 있습니다.</main>;
  if (broadcast.isError || !item) {
    return <main className="detail-loading"><TriangleAlert />방송 기록을 찾을 수 없습니다.<Link href="/">홈으로 돌아가기</Link></main>;
  }

  const changes = item.metadataEvents
    ?.filter((event) => event.detectedAt > item.startedAt && event.previousValue !== event.newValue)
    .slice()
    .reverse() ?? [];
  const categoryChanges = changes.filter((event) => event.type === "category").length;
  const titleChanges = changes.filter((event) => event.type === "title").length;

  return (
    <main className="page-shell detail-page">
      <Link href="/" className="back-link"><ArrowLeft size={16} /> 전체 방송</Link>
      <section className="detail-heading">
        <div>
          <div className="detail-meta">
            <span className={`record-status ${item.status === "live" ? "live" : ""}`}>
              {item.status === "live" ? "변경 추적 중" : "추적 완료"}
            </span>
            <span>{formatDate(item.startedAt)}</span>
            {item.category && <span>{item.category}</span>}
          </div>
          <h1>{item.title}</h1>
          <Link href={`/streamers/${item.channelId}`} className="streamer-link">{item.channelName}<ArrowUpRight size={14} /></Link>
        </div>
        {item.vodUrl
          ? <a className="button primary" href={item.vodUrl} target="_blank" rel="noreferrer">치지직에서 다시보기 <ExternalLink size={16} /></a>
          : <span className="vod-pending"><Clock3 size={15} /> 연결된 다시보기 없음</span>}
      </section>

      <section className="detail-stats">
        <article><span>카테고리 변경</span><strong>{categoryChanges}</strong><small>방송 중 감지</small></article>
        <article><span>방제 변경</span><strong>{titleChanges}</strong><small>방송 중 감지</small></article>
        <article><span>방송 길이</span><strong>{formatDuration(item.startedAt, item.endedAt)}</strong><small>{item.status === "live" ? "현재까지" : "추적 기준"}</small></article>
      </section>

      <section className="metadata-history metadata-history-primary">
        <div><span className="kicker">CHANGE LOG</span><h2>방송 정보 변경</h2></div>
        {changes.length ? (
          <div>
            {changes.map((event) => (
              <article key={event.id}>
                <span>{event.type === "category" ? <><Tag size={13} />카테고리</> : <><History size={13} />방제</>}</span>
                <p><del>{event.previousValue || "없음"}</del><strong>{event.newValue || "없음"}</strong></p>
                <time>{new Intl.DateTimeFormat("ko-KR", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Seoul"
                }).format(event.detectedAt)}</time>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-card"><Radio /><div><h3>아직 변경이 없습니다.</h3><p>카테고리나 방제가 바뀌면 감지 시각과 함께 기록됩니다.</p></div></div>
        )}
      </section>
    </main>
  );
}
