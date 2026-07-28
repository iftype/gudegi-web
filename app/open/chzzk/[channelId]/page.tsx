import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChzzkRedirect } from "@/components/chzzk-redirect";
import { getChzzkLiveUrl } from "@/lib/chzzk";

export const metadata: Metadata = {
  title: "치지직 방송으로 이동"
};

export default async function OpenChzzkPage({
  params
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;
  const targetUrl = getChzzkLiveUrl(channelId);
  if (!targetUrl) notFound();
  return <ChzzkRedirect targetUrl={targetUrl} channelId={channelId} />;
}
