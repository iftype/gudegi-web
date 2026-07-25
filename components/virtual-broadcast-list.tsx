"use client";

import Link from "next/link";
import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowUpRight, Flame, MessageCircle } from "lucide-react";
import type { Broadcast } from "@/lib/types";
import { formatCount, formatDate, formatDuration } from "@/lib/format";

export function VirtualBroadcastList({ broadcasts }: { broadcasts: Broadcast[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: broadcasts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 112,
    overscan: 5
  });

  const height = Math.min(560, broadcasts.length * 112);
  return (
    <div ref={parentRef} className="broadcast-scroll" style={{ height }}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const broadcast = broadcasts[virtualItem.index];
          if (!broadcast) return null;
          return (
            <Link
              className="broadcast-row"
              href={`/broadcasts/${broadcast.id}`}
              key={broadcast.id}
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              <div className="broadcast-date"><strong>{new Date(broadcast.startedAt).getDate()}</strong><span>{new Intl.DateTimeFormat("ko-KR", { month: "short" }).format(broadcast.startedAt)}</span></div>
              <div className="broadcast-main">
                <div><span className={`record-status ${broadcast.status === "live" ? "live" : ""}`}>{broadcast.status === "live" ? "수집 중" : "수집 완료"}</span><span>{formatDate(broadcast.startedAt)}</span></div>
                <h3>{broadcast.title}</h3>
                <p>{broadcast.channelName} · {formatDuration(broadcast.startedAt, broadcast.endedAt)}</p>
              </div>
              <div className="row-stat"><MessageCircle /><span>채팅</span><strong>{formatCount(Number(broadcast.chatCount))}</strong></div>
              <div className="row-stat hot"><Flame /><span>급증</span><strong>{broadcast.burstCount}</strong></div>
              <ArrowUpRight className="row-arrow" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
