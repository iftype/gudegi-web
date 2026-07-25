import { StreamerExperience } from "@/components/streamer-experience";

export default async function StreamerPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  return <StreamerExperience channelId={channelId} />;
}
