const CHANNEL_ID_PATTERN = /^[a-f0-9]{32}$/i;

export function isChzzkChannelId(channelId: string) {
  return CHANNEL_ID_PATTERN.test(channelId);
}

export function getChzzkLiveUrl(channelId: string) {
  if (!isChzzkChannelId(channelId)) return null;
  return `https://chzzk.naver.com/live/${channelId}`;
}
