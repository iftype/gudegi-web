"use client";

import { Analytics } from "@vercel/analytics/next";

export function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => ({
        ...event,
        url: event.url.split(/[?#]/, 1)[0]
      })}
    />
  );
}
