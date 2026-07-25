"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Clock3, ExternalLink, Info, MessageCircle, Search, TriangleAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { FormEvent, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { api } from "@/lib/api";
import { formatCount, formatDate, formatDuration, formatElapsed, resolveTimelineOrigin } from "@/lib/format";
import type { TimelineBucket } from "@/lib/types";

export function BroadcastExperience({ broadcastId }: { broadcastId: string }) {
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const resolution = 10;
  const broadcast = useQuery({
    queryKey: ["broadcast", broadcastId],
    queryFn: ({ signal }) => api.broadcast(broadcastId, signal),
    refetchInterval: (query) => query.state.data?.data.status === "live" ? 15_000 : false
  });
  const timeline = useQuery({
    queryKey: ["timeline", broadcastId, resolution],
    queryFn: ({ signal }) => api.timeline(broadcastId, resolution, signal),
    refetchInterval: broadcast.data?.data.status === "live" ? 15_000 : false
  });
  const messages = useQuery({
    queryKey: ["messages", broadcastId, selectedBucket, resolution],
    queryFn: ({ signal }) => api.messages(broadcastId, selectedBucket!, resolution, signal),
    enabled: selectedBucket !== null
  });
  const search = useQuery({
    queryKey: ["search", broadcastId, submittedQuery],
    queryFn: ({ signal }) => api.search(broadcastId, submittedQuery, signal),
    enabled: submittedQuery.length >= 2
  });
  const item = broadcast.data?.data;
  const timelineOrigin = item
    ? resolveTimelineOrigin(item.startedAt, timeline.data?.data[0]?.bucketStart)
    : 0;

  if (broadcast.isLoading) return <main className="detail-loading">타임라인을 불러오고 있습니다.</main>;
  if (broadcast.isError || !item) {
    return <main className="detail-loading"><TriangleAlert />방송 기록을 찾을 수 없습니다.<Link href="/">홈으로 돌아가기</Link></main>;
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setSubmittedQuery(searchQuery.trim());
  }

  return (
    <main className="page-shell detail-page">
      <Link href="/" className="back-link"><ArrowLeft size={16} /> 전체 방송</Link>
      <section className="detail-heading">
        <div>
          <div className="detail-meta"><span className={`record-status ${item.status === "live" ? "live" : ""}`}>{item.status === "live" ? "실시간 수집 중" : "수집 완료"}</span><span>{formatDate(item.startedAt)}</span>{item.category && <span>{item.category}</span>}</div>
          <h1>{item.title}</h1>
          <Link href={`/streamers/${item.channelId}`} className="streamer-link">{item.channelName}<ArrowUpRight size={14} /></Link>
        </div>
        {item.vodUrl ? <a className="button primary" href={item.vodUrl} target="_blank" rel="noreferrer">치지직에서 다시보기 <ExternalLink size={16} /></a> : <span className="vod-pending"><Clock3 size={15} /> VOD 연결 대기 중</span>}
      </section>

      <section className="detail-stats">
        <article><span>수집 채팅</span><strong>{formatCount(Number(item.chatCount))}</strong><small>전체 메시지 수</small></article>
        <article><span>급증 구간</span><strong>{item.burstCount}</strong><small>평소 대비 강한 반응</small></article>
        <article><span>방송 길이</span><strong>{formatDuration(item.startedAt, item.endedAt)}</strong><small>{item.status === "live" ? "현재까지" : "수집 기준"}</small></article>
      </section>

      {item.gaps?.length ? <div className="gap-notice"><TriangleAlert /><span><strong>수집 공백 {item.gaps.length}회</strong> 연결이 끊긴 구간은 채팅이 없었던 구간과 다르게 표시됩니다.</span></div> : null}

      <section className="timeline-panel">
        <div className="panel-title">
          <div><span className="kicker">REACTION DENSITY</span><h2>채팅 반응 타임라인</h2></div>
          <div className="legend"><span><i /> 일반</span><span><i className="burst" /> 급증</span></div>
        </div>
        <p className="panel-description">막대에 마우스를 올리거나 탭하면 해당 구간의 익명 대표 채팅을 볼 수 있습니다.</p>
        {timeline.data?.data.length ? (
          <ReactionTimeline
            buckets={timeline.data.data}
            startedAt={timelineOrigin}
            selectedBucket={selectedBucket}
            onSelect={setSelectedBucket}
          />
        ) : (
          <div className="timeline-empty">아직 집계된 채팅 구간이 없습니다.</div>
        )}
        <MessagePanel
          loading={messages.isLoading}
          messages={messages.data?.data ?? []}
          selectedBucket={selectedBucket}
          startedAt={timelineOrigin}
        />
      </section>

      <section className="search-panel">
        <div className="panel-title"><div><span className="kicker">SAMPLED SEARCH</span><h2>대표 채팅 검색</h2></div></div>
        <form onSubmit={submitSearch} className="search-form">
          <Search aria-hidden />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="두 글자 이상의 반응이나 문구를 검색하세요" minLength={2} maxLength={50} aria-label="대표 채팅 검색어" />
          <button>검색</button>
        </form>
        <div className="sample-notice"><Info size={15} /> 전체 채팅이 아닌 보존된 익명 표본만 검색합니다. 90일이 지난 채팅 문장은 자동 삭제됩니다.</div>
        {search.isFetching && <div className="search-empty">검색 중입니다.</div>}
          {search.data && <div className="search-results">
          {search.data.data.length ? search.data.data.map((message) => (
            <button key={message.id} onClick={() => setSelectedBucket(message.bucketStart)}>
              <span>{formatElapsed(message.bucketStart - timelineOrigin)}</span>
              <p>{message.content}</p>
              {message.occurrences > 1 && <strong>{message.occurrences}회</strong>}
            </button>
          )) : <div className="search-empty">표본에서 일치하는 채팅을 찾지 못했습니다.</div>}
        </div>}
      </section>
    </main>
  );
}

function ReactionTimeline({ buckets, startedAt, selectedBucket, onSelect }: {
  buckets: TimelineBucket[];
  startedAt: number;
  selectedBucket: number | null;
  onSelect: (bucket: number) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const max = useMemo(() => Math.max(...buckets.map((bucket) => bucket.totalCount), 1), [buckets]);
  const virtualizer = useVirtualizer({
    horizontal: true,
    count: buckets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 18,
    overscan: 30
  });

  return (
    <div className="timeline-scroll" ref={parentRef}>
      <div className="timeline-bars" style={{ width: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const bucket = buckets[virtualItem.index];
          if (!bucket) return null;
          const height = Math.max(4, (bucket.totalCount / max) * 100);
          return (
            <button
              key={bucket.bucketStart}
              className={`${bucket.isBurst ? "burst" : ""} ${selectedBucket === bucket.bucketStart ? "selected" : ""}`}
              style={{ left: virtualItem.start, height: `${height}%` }}
              onMouseEnter={() => onSelect(bucket.bucketStart)}
              onFocus={() => onSelect(bucket.bucketStart)}
              onClick={() => onSelect(bucket.bucketStart)}
              aria-label={`${formatElapsed(bucket.bucketStart - startedAt)}, 채팅 ${bucket.totalCount}개${bucket.isBurst ? ", 급증 구간" : ""}`}
            />
          );
        })}
      </div>
      <div className="timeline-times"><span>{formatElapsed((buckets[0]?.bucketStart ?? startedAt) - startedAt)}</span><span>{formatElapsed((buckets.at(-1)?.bucketStart ?? startedAt) - startedAt)}</span></div>
    </div>
  );
}

function MessagePanel({ messages, selectedBucket, startedAt, loading }: {
  messages: Awaited<ReturnType<typeof api.messages>>["data"];
  selectedBucket: number | null;
  startedAt: number;
  loading: boolean;
}) {
  return (
    <div className="message-panel">
      <div className="message-panel-header"><span>{selectedBucket === null ? "구간을 선택하세요" : `${formatElapsed(selectedBucket - startedAt)} 대표 반응`}</span>{messages.length > 0 && <small>{messages.length}개 표본</small>}</div>
      {loading ? <p className="message-placeholder">대표 채팅을 불러오는 중입니다.</p> : messages.length ? (
        <div className="message-cloud">{messages.map((message) => (
          <div key={message.id} className={message.reason === "keyword" ? "keyword" : ""}>
            <MessageCircle size={13} /><span>{message.content}</span>
            {message.occurrences > 1 && <strong>{message.occurrences}×</strong>}
          </div>
        ))}</div>
      ) : <p className="message-placeholder">{selectedBucket === null ? "막대를 선택하면 이곳에 채팅 표본이 나타납니다." : "이 구간에 보존된 대표 채팅이 없습니다."}</p>}
    </div>
  );
}
