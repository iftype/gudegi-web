import type { Metadata } from "next";
import { BroadcastExperience } from "@/components/broadcast-experience";

export const metadata: Metadata = { title: "방송 타임라인" };

export default async function BroadcastPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BroadcastExperience broadcastId={id} />;
}
