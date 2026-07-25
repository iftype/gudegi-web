export function formatCount(value: number) {
  return new Intl.NumberFormat("ko-KR", { notation: value >= 10_000 ? "compact" : "standard" }).format(value);
}

export function formatDate(value: number) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

export function formatElapsed(value: number) {
  const seconds = Math.max(0, Math.floor(value / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
    : `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function formatDuration(startedAt: number, endedAt: number | null) {
  const minutes = Math.floor(((endedAt ?? Date.now()) - startedAt) / 60_000);
  if (minutes < 60) return `${minutes}분`;
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`;
}
