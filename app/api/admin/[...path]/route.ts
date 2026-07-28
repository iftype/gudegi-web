import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const apiUrl = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
    .replace(/\/$/, "");
  const target = `${apiUrl}/v1/admin/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const cookie = request.headers.get("cookie");
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (contentType) headers.set("content-type", contentType);
  if (cookie) headers.set("cookie", cookie);
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);
  headers.set("accept", "application/json");

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer(),
    cache: "no-store",
    redirect: "manual"
  });
  const responseHeaders = new Headers({
    "cache-control": "no-store, private",
    "content-type": upstream.headers.get("content-type") ?? "application/json"
  });
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) {
    // The API cookie belongs to sub.iftype.store when used directly. Through this
    // same-origin proxy it must be host-only so the browser stores it for Vercel.
    responseHeaders.set("set-cookie", setCookie.replace(/;\s*Domain=[^;]+/i, ""));
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
