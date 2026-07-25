"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Clock3, ExternalLink, Info, MessageCircle, Search, TriangleAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { FormEvent, KeyboardEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatCount, formatDate, formatDuration, formatElapsed, resolveTimelineOrigin } from "@/lib/format";
import type { TimelineBucket } from "@/lib/types";

export function BroadcastExperience({ broadcastId }: { broadcastId: string }) {
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [resolution, setResolution] = useState<60 | 600>(60);
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
  const timelineBuckets = timeline.data?.data;
  const defaultBucket = timelineBuckets?.[0]?.bucketStart;
  const resolvedSelectedBucket = selectedBucket ?? defaultBucket ?? null;
  const messagesBucket = useDebouncedValue(resolvedSelectedBucket, 180);
  const messages = useQuery({
    queryKey: ["messages", broadcastId, messagesBucket, resolution],
    queryFn: ({ signal }) => api.messages(broadcastId, messagesBucket!, resolution, signal),
    enabled: messagesBucket !== null,
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60_000
  });
  const search = useQuery({
    queryKey: ["search", broadcastId, submittedQuery],
    queryFn: ({ signal }) => api.search(broadcastId, submittedQuery, signal),
    enabled: submittedQuery.length >= 2
  });
  const highlightedBuckets = useMemo(() => {
    const matches = new Set<number>();
    if (submittedQuery.length < 2) return matches;
    const resolutionMs = resolution * 1000;
    for (const message of search.data?.data ?? []) {
      matches.add(Math.floor(message.bucketStart / resolutionMs) * resolutionMs);
    }
    return matches;
  }, [resolution, search.data, submittedQuery]);
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
          <div className="timeline-controls" aria-label="타임라인 구간 단위">
            <button className={resolution === 60 ? "active" : ""} onClick={() => {
              setSelectedBucket(null);
              setResolution(60);
            }}>1분</button>
            <button className={resolution === 600 ? "active" : ""} onClick={() => {
              setSelectedBucket(null);
              setResolution(600);
            }}>10분</button>
          </div>
        </div>
        <div className="timeline-legend-row">
          <p className="panel-description">차트 아래의 탐색 영역을 마우스로 훑거나 손가락으로 끌면 측정선이 해당 구간을 가리킵니다.</p>
          <div className="legend"><span><i /> 일반</span><span><i className="burst" /> 급증</span>{highlightedBuckets.size > 0 && <span><i className="search-match" /> 검색 일치</span>}</div>
        </div>
        <div className="timeline-workspace">
          <div className="timeline-main">
            {timeline.data?.data.length ? (
              <ReactionTimeline
                key={resolution}
                buckets={timeline.data.data}
                startedAt={timelineOrigin}
                resolution={resolution}
                selectedBucket={resolvedSelectedBucket}
                highlightedBuckets={highlightedBuckets}
                onSelect={setSelectedBucket}
              />
            ) : (
              <div className="timeline-empty">아직 집계된 채팅 구간이 없습니다.</div>
            )}
          </div>
          <MessagePanel
            loading={messages.isLoading && !messages.data}
            refreshing={messages.isFetching && Boolean(messages.data)}
            messages={messages.data?.data ?? []}
            selectedBucket={messagesBucket}
            startedAt={timelineOrigin}
          />
        </div>
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
        {!search.isFetching && highlightedBuckets.size > 0 && (
          <div className="search-highlight-status">
            <i /> 타임라인에서 일치하는 {highlightedBuckets.size}개 구간을 밝게 표시했습니다.
          </div>
        )}
          {search.data && <div className="search-results">
          {search.data.data.length ? search.data.data.map((message) => (
            <button key={message.id} onClick={() => {
              const resolutionMs = resolution * 1000;
              setSelectedBucket(Math.floor(message.bucketStart / resolutionMs) * resolutionMs);
            }}>
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

function ReactionTimeline({ buckets, startedAt, resolution, selectedBucket, highlightedBuckets, onSelect }: {
  buckets: TimelineBucket[];
  startedAt: number;
  resolution: 60 | 600;
  selectedBucket: number | null;
  highlightedBuckets: Set<number>;
  onSelect: (bucket: number) => void;
}) {
  const scrubberRef = useRef<HTMLDivElement>(null);
  const max = useMemo(() => Math.max(...buckets.map((bucket) => bucket.totalCount), 1), [buckets]);
  const selectedIndex = Math.max(0, buckets.findIndex((bucket) => bucket.bucketStart === selectedBucket));
  const selected = buckets[selectedIndex] ?? buckets[0];
  const selectionPosition = buckets.length > 0
    ? ((selectedIndex + 0.5) / buckets.length) * 100
    : 0;

  function selectAt(clientX: number) {
    const scrubber = scrubberRef.current;
    if (!scrubber || buckets.length === 0) return;
    const bounds = scrubber.getBoundingClientRect();
    const position = Math.min(Math.max(clientX - bounds.left, 0), bounds.width);
    const index = Math.min(
      buckets.length - 1,
      Math.floor((position / Math.max(bounds.width, 1)) * buckets.length)
    );
    onSelect(buckets[index].bucketStart);
  }

  function startScrub(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.scrubbing = "true";
    selectAt(event.clientX);
  }

  function moveScrub(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" || event.currentTarget.hasPointerCapture(event.pointerId)) {
      selectAt(event.clientX);
    }
  }

  function endScrub(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    delete event.currentTarget.dataset.scrubbing;
  }

  function moveWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = selectedIndex;
    if (event.key === "ArrowLeft") nextIndex = Math.max(0, selectedIndex - 1);
    if (event.key === "ArrowRight") nextIndex = Math.min(buckets.length - 1, selectedIndex + 1);
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = buckets.length - 1;
    onSelect(buckets[nextIndex].bucketStart);
  }

  const selectedElapsed = selected ? formatElapsed(selected.bucketStart - startedAt) : "0:00";
  return (
    <div className="timeline-chart">
      <div className="timeline-bars">
        {buckets.map((bucket, index) => {
          const height = Math.max(4, (bucket.totalCount / max) * 100);
          return (
            <i
              key={bucket.bucketStart}
              className={`${bucket.isBurst ? "burst" : ""} ${highlightedBuckets.has(bucket.bucketStart) ? "search-match" : ""}`}
              style={{
                left: `${(index / buckets.length) * 100}%`,
                width: `${Math.max(100 / buckets.length, 0.12)}%`,
                height: `${height}%`
              }}
            />
          );
        })}
        <span className="timeline-measure-line" style={{ left: `${selectionPosition}%` }}>
          <strong>{selectedElapsed}</strong>
        </span>
      </div>
      <div
        ref={scrubberRef}
        className="timeline-scrubber"
        role="slider"
        tabIndex={0}
        aria-label="채팅 타임라인 탐색"
        aria-valuemin={0}
        aria-valuemax={Math.max(0, buckets.length - 1)}
        aria-valuenow={selectedIndex}
        aria-valuetext={`${selectedElapsed}부터 ${resolution === 60 ? "1분" : "10분"}, 채팅 ${selected?.totalCount ?? 0}개`}
        onPointerDown={startScrub}
        onPointerMove={moveScrub}
        onPointerUp={endScrub}
        onPointerCancel={endScrub}
        onKeyDown={moveWithKeyboard}
      >
        <div className="scrubber-fill" style={{ width: `${selectionPosition}%` }} />
        <span className="scrubber-handle" style={{ left: `${selectionPosition}%` }} />
        <div className="scrubber-value">
          <span>{selectedElapsed}</span>
          <strong>{formatCount(selected?.totalCount ?? 0)}개</strong>
          {selected?.isBurst && <em>급증</em>}
        </div>
      </div>
      <div className="timeline-axis" aria-hidden>
        <span>{formatElapsed(buckets[0].bucketStart - startedAt)}</span>
        <span>{formatElapsed(buckets[buckets.length - 1].bucketStart - startedAt + resolution * 1000)}</span>
      </div>
    </div>
  );
}

function MessagePanel({ messages, selectedBucket, startedAt, loading, refreshing }: {
  messages: Awaited<ReturnType<typeof api.messages>>["data"];
  selectedBucket: number | null;
  startedAt: number;
  loading: boolean;
  refreshing: boolean;
}) {
  return (
    <div className="message-panel">
      <div className="message-panel-header">
        <span>{selectedBucket === null ? "구간을 선택하세요" : `${formatElapsed(selectedBucket - startedAt)} 대표 반응`}</span>
        <small>{refreshing ? "갱신 중" : messages.length > 0 ? `${messages.length}개 표본` : ""}</small>
      </div>
      {loading ? <p className="message-placeholder">대표 채팅을 불러오는 중입니다.</p> : messages.length ? (
        <div className="message-list">{messages.map((message) => (
          <div key={message.id} className={message.reason === "keyword" ? "keyword" : ""}>
            <MessageCircle size={13} /><span>{message.content}</span>
            {message.occurrences > 1 && <strong>{message.occurrences}×</strong>}
          </div>
        ))}</div>
      ) : <p className="message-placeholder">{selectedBucket === null ? "막대를 선택하면 이곳에 채팅 표본이 나타납니다." : "이 구간에 보존된 대표 채팅이 없습니다."}</p>}
    </div>
  );
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}
