"use client";

import Link from "next/link";
import { ArrowRight, Clock3, MessageCircle, Radio, Search, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { VirtualBroadcastList } from "./virtual-broadcast-list";

export function HomeExperience() {
  const streamers = useQuery({
    queryKey: ["streamers"],
    queryFn: ({ signal }) => api.streamers(signal),
    refetchInterval: 15_000
  });
  const broadcasts = useQuery({
    queryKey: ["broadcasts"],
    queryFn: ({ signal }) => api.broadcasts(signal),
    refetchInterval: (query) => query.state.data?.data.some((item) => item.status === "live") ? 15_000 : false
  });

  const live = streamers.data?.data.filter((streamer) => streamer.isLive) ?? [];
  const recent = broadcasts.data?.data ?? [];
  const hasError = streamers.isError && broadcasts.isError;

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="kicker"><span /> CHAT REACTION TIMELINE</span>
          <h1>채팅이 <em>터진 순간</em>을<br />한눈에 찾아보세요.</h1>
          <p>방송 전체를 다시 훑지 않아도 괜찮아요. 익명 채팅 반응의 밀도와 반복 문구로 중요한 순간을 빠르게 탐색합니다.</p>
          <div className="hero-actions">
            <a href="#live" className="button primary"><Radio size={17} /> 지금 방송 보기</a>
            <a href="#archive" className="button ghost"><Clock3 size={17} /> 지난 방송 탐색</a>
          </div>
          <div className="privacy-note"><span>개인정보 최소화</span> 닉네임과 사용자 ID는 저장하지 않습니다.</div>
        </div>
        <div className="signal-card" aria-label="채팅 반응 타임라인 예시">
          <div className="signal-card-header">
            <div><span className="live-dot" />LIVE SIGNAL</div>
            <span>10초 단위</span>
          </div>
          <div className="signal-chart">
            {[18, 24, 20, 32, 29, 42, 35, 48, 52, 84, 100, 64, 42, 31, 27, 39, 33, 28, 36, 30].map((height, index) => (
              <i key={index} className={height >= 80 ? "hot" : ""} style={{ height: `${height}%` }} />
            ))}
            <div className="signal-tooltip"><strong>채팅 급증</strong><span>ㅋㅋㅋㅋ · 128회</span><span>이게 되네 · 74회</span></div>
          </div>
          <div className="signal-axis"><span>1:12:00</span><span>1:14:00</span><span>1:16:00</span></div>
          <div className="signal-stats">
            <div><span>현재 채팅</span><strong>1,284</strong><small>/분</small></div>
            <div><span>반응 강도</span><strong>4.8</strong><small>× 평소</small></div>
          </div>
        </div>
      </section>

      <section className="feature-strip" aria-label="서비스 특징">
        <article><MessageCircle /><div><strong>익명 채팅 표본</strong><span>닉네임 없이 반응만 보존</span></div></article>
        <article><Sparkles /><div><strong>급증 구간 감지</strong><span>최근 흐름과 비교해 자동 강조</span></div></article>
        <article><Search /><div><strong>반복 문구 검색</strong><span>저장된 표본에서 순간 탐색</span></div></article>
      </section>

      <section id="live" className="content-section">
        <div className="section-heading">
          <div><span className="kicker">ON AIR</span><h2>지금 수집 중인 방송</h2></div>
          <span className="section-count">{live.length} LIVE</span>
        </div>
        {hasError ? <ServiceUnavailable /> : streamers.isLoading ? <CardSkeleton /> : live.length ? (
          <div className="live-grid">{live.map((streamer) => (
            <Link className="live-card" href={streamer.activeBroadcastId ? `/broadcasts/${streamer.activeBroadcastId}` : `/streamers/${streamer.channelId}`} key={streamer.channelId}>
              <div className="avatar">{streamer.channelImageUrl ? <img src={streamer.channelImageUrl} alt="" /> : streamer.channelName.slice(0, 1)}</div>
              <div><span className="live-badge"><span /> LIVE</span><h3>{streamer.channelName}</h3><p>채팅 반응을 수집하고 있습니다.</p></div>
              <ArrowRight aria-hidden />
            </Link>
          ))}</div>
        ) : (
          <div className="empty-card"><Radio /><div><h3>현재 수집 중인 방송이 없어요.</h3><p>등록된 스트리머가 방송을 시작하면 1분 안에 자동으로 연결됩니다.</p></div></div>
        )}
      </section>

      <section id="archive" className="content-section archive-section">
        <div className="section-heading">
          <div><span className="kicker">ARCHIVE</span><h2>최근 방송 타임라인</h2></div>
          <span className="section-count">{recent.length} RECORDS</span>
        </div>
        {broadcasts.isLoading ? <CardSkeleton /> : recent.length ? (
          <VirtualBroadcastList broadcasts={recent} />
        ) : (
          <div className="empty-card"><Clock3 /><div><h3>아직 기록된 방송이 없어요.</h3><p>첫 방송 수집이 끝나면 채팅 타임라인이 여기에 쌓입니다.</p></div></div>
        )}
      </section>

      <section className="how-section">
        <div><span className="kicker">HOW IT WORKS</span><h2>방송 내용이 아니라<br />시청자의 반응을 기록합니다.</h2></div>
        <ol>
          <li><span>01</span><div><strong>모든 채팅을 10초 단위로 집계</strong><p>메시지 수는 남기되 사용자 정보는 받지 않습니다.</p></div></li>
          <li><span>02</span><div><strong>급증과 반복 반응을 선별</strong><p>평소보다 반응이 모인 구간과 대표 문구만 보존합니다.</p></div></li>
          <li><span>03</span><div><strong>타임라인에서 직접 판단</strong><p>AI의 추측 대신 실제 반응 표본을 근거로 제공합니다.</p></div></li>
        </ol>
      </section>
    </main>
  );
}

function CardSkeleton() {
  return <div className="skeleton-card" aria-label="불러오는 중"><span /><span /><span /></div>;
}

function ServiceUnavailable() {
  return <div className="empty-card error-state"><Radio /><div><h3>수집 서버에 연결할 수 없어요.</h3><p>잠시 후 다시 확인해 주세요. 기존 기록은 서버 연결 후 표시됩니다.</p></div></div>;
}
