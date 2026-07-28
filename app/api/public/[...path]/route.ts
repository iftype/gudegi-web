import type { NextRequest } from "next/server";
import { proxyApi } from "@/lib/server/proxy-api";

export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function proxy(request: NextRequest, context: RouteContext) {
  return proxyApi(request, context, null);
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
