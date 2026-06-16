/** Append "ost" to YouTube search queries for music-focused results. */
export function appendOstToQuery(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return trimmed;
  if (/\bost\b/i.test(trimmed)) return trimmed;
  if (/\bsoundtrack\b/i.test(trimmed)) return trimmed;
  return `${trimmed} ost`;
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function buildYouTubeEmbedUrl(
  videoId: string,
  options?: { start?: number; end?: number; autoplay?: boolean },
): string {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
  });
  if (options?.start !== undefined) params.set('start', String(Math.floor(options.start)));
  if (options?.end !== undefined) params.set('end', String(Math.floor(options.end)));
  if (options?.autoplay) params.set('autoplay', '1');
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
