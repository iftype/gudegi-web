import type { NextRequest } from "next/server";
import { proxyApi } from "@/lib/server/proxy-api";

export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxy(request: NextRequest, context: RouteContext) {
  return proxyApi(request, context, "admin");
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
