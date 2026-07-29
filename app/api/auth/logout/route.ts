import { after, type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "trackline_user_session";

export async function POST(request: NextRequest) {
  const apiUrl = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
    .replace(/\/$/, "");
  const cookie = request.headers.get("cookie");

  after(async () => {
    try {
      await fetch(`${apiUrl}/v1/auth/session`, {
        method: "DELETE",
        headers: cookie ? { cookie } : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(5_000)
      });
    } catch {
      // The browser cookie is already cleared below. The server session expires
      // automatically even when this best-effort cleanup is temporarily unavailable.
    }
  });

  const response = new NextResponse(null, {
    status: 204,
    headers: { "cache-control": "no-store, private" }
  });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0
  });
  return response;
}
