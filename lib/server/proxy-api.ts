import "server-only";
import type { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function proxyApi(
  request: NextRequest,
  context: RouteContext,
  apiPrefix: "admin" | "auth"
) {
  const { path } = await context.params;
  const apiUrl = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
    .replace(/\/$/, "");
  const target = `${apiUrl}/v1/${apiPrefix}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const headers = new Headers();
  for (const name of ["content-type", "cookie", "x-forwarded-for", "user-agent"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
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
  for (const setCookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", setCookie.replace(/;\s*Domain=[^;]+/gi, ""));
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders
  });
}
