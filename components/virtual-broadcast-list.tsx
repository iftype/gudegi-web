"use client";

import Link from "next/link";
import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowUpRight, History, Tag } from "lucide-react";
import type { Broadcast } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/format";

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
              <div className="row-stat"><Tag /><span>카테고리</span><strong>{broadcast.category || "미분류"}</strong></div>
              <div className="row-stat hot"><History /><span>변경</span><strong>{broadcast.changeCount}</strong></div>
              <ArrowUpRight className="row-arrow" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
