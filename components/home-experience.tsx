"use client";

import Link from "next/link";
import { ArrowRight, BellRing, CalendarDays, Clock3, History, Radio, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { VirtualBroadcastList } from "./virtual-broadcast-list";
import { VodCalendarExperience } from "./vod-calendar-experience";
import { PwaInstallButton } from "./pwa-install-button";

export function HomeExperience() {
  useEffect(() => {
    trackEvent("page_view");
  }, []);

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
          <span className="kicker"><span /> LIVE CATEGORY TRACKER</span>
          <h1>보고 싶은 방송으로<br /><em>바뀌는 순간</em> 알려드려요.</h1>
          <p>여러 스트리머의 방송 카테고리와 방제 변경을 주기적으로 확인하고, 원하는 변경이 생기면 PWA 푸시로 알려드립니다.</p>
          <div className="hero-actions">
            <a href="#alerts" className="button primary"><BellRing size={17} /> 알림 설정하기</a>
            <PwaInstallButton />
            <a href="#calendar" className="button ghost"><CalendarDays size={17} /> 방송 달력</a>
          </div>
          <div className="privacy-note"><span>메타데이터 전용</span> 채팅과 19세 방송은 수집하지 않습니다.</div>
        </div>
        <div className="signal-card change-card" aria-label="방송 정보 변경 예시">
          <div className="signal-card-header">
            <div><span className="live-dot" />LIVE CHANGE FEED</div>
            <span>상태별 1~5분 확인</span>
          </div>
          <div className="change-preview">
            <article><span>20:14</span><div><small>카테고리</small><del>토크</del><strong>리그 오브 레전드</strong></div></article>
            <article><span>21:02</span><div><small>방제</small><del>저녁 방송</del><strong>마지막 한 판</strong></div></article>
            <article><span>22:36</span><div><small>카테고리</small><del>리그 오브 레전드</del><strong>마인크래프트</strong></div></article>
          </div>
          <div className="signal-stats">
            <div><span>추적 채널</span><strong>{streamers.data?.data.length ?? "—"}</strong><small>개</small></div>
            <div><span>현재 방송</span><strong>{live.length}</strong><small>LIVE</small></div>
          </div>
        </div>
      </section>

      <section className="feature-strip" aria-label="서비스 특징">
        <article><BellRing /><div><strong>변경 즉시 알림</strong><span>카테고리와 방제를 선택해 구독</span></div></article>
        <article><History /><div><strong>변경 이력</strong><span>방송별 변경 시각을 한눈에 확인</span></div></article>
        <article><ShieldCheck /><div><strong>채팅 미수집</strong><span>방송 메타데이터만 최소 저장</span></div></article>
      </section>

      <section id="live" className="content-section">
        <div className="section-heading">
          <div><span className="kicker">ON AIR</span><h2>지금 추적 중인 방송</h2></div>
          <span className="section-count">{live.length} LIVE</span>
        </div>
        {hasError ? <ServiceUnavailable /> : streamers.isLoading ? <CardSkeleton /> : live.length ? (
          <div className="live-grid">{live.map((streamer) => (
            <Link className="live-card" href={streamer.activeBroadcastId ? `/broadcasts/${streamer.activeBroadcastId}` : `/streamers/${streamer.channelId}`} key={streamer.channelId}>
              <div className="avatar">{streamer.channelImageUrl ? <img src={streamer.channelImageUrl} alt="" /> : streamer.channelName.slice(0, 1)}</div>
              <div><span className="live-badge"><span /> LIVE</span><h3>{streamer.channelName}</h3><p>카테고리와 방제 변경을 확인하고 있습니다.</p></div>
              <ArrowRight aria-hidden />
            </Link>
          ))}</div>
        ) : (
          <div className="empty-card"><Radio /><div><h3>현재 추적 중인 방송이 없어요.</h3><p>등록된 스트리머가 방송을 시작하면 다음 확인 주기에 기록됩니다.</p></div></div>
        )}
      </section>

      <VodCalendarExperience streamers={streamers.data?.data ?? []} />

      <section id="archive" className="content-section archive-section">
        <div className="section-heading">
          <div><span className="kicker">ARCHIVE</span><h2>최근 방송 변경 기록</h2></div>
          <span className="section-count">{recent.length} RECORDS</span>
        </div>
        {broadcasts.isLoading ? <CardSkeleton /> : recent.length ? (
          <VirtualBroadcastList broadcasts={recent} />
        ) : (
          <div className="empty-card"><Clock3 /><div><h3>아직 기록된 방송이 없어요.</h3><p>첫 방송이 확인되면 카테고리와 방제 이력이 여기에 쌓입니다.</p></div></div>
        )}
      </section>

      <section className="how-section">
        <div><span className="kicker">HOW IT WORKS</span><h2>필요한 정보만<br />가볍게 추적합니다.</h2></div>
        <ol>
          <li><span>01</span><div><strong>등록 채널 상태를 순차 확인</strong><p>동시 요청 수를 제한해 많은 채널도 서버에 무리 없이 확인합니다.</p></div></li>
          <li><span>02</span><div><strong>카테고리와 방제 변경만 기록</strong><p>채팅 소켓에 연결하지 않고 방송 메타데이터만 비교합니다.</p></div></li>
          <li><span>03</span><div><strong>원하는 변경만 푸시</strong><p>기기별로 카테고리·방제 알림을 각각 켜고 끌 수 있습니다.</p></div></li>
        </ol>
      </section>
    </main>
  );
}

function CardSkeleton() {
  return <div className="skeleton-card" aria-label="불러오는 중"><span /><span /><span /></div>;
}

function ServiceUnavailable() {
  return <div className="empty-card error-state"><Radio /><div><h3>추적 서버에 연결할 수 없어요.</h3><p>잠시 후 다시 확인해 주세요. 기존 기록은 서버 연결 후 표시됩니다.</p></div></div>;
}
