export type TranscriptSegment = {
  start: number;
  dur: number;
  text: string;
};

function getCacheKey(courseId: string) {
  return `coach_transcript_${courseId}`;
}

function safeParseFloat(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace('/', '') || null;
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return id;
      const pathParts = u.pathname.split('/').filter(Boolean);
      const embedIndex = pathParts.findIndex(p => p === 'embed');
      if (embedIndex >= 0 && pathParts[embedIndex + 1]) return pathParts[embedIndex + 1];
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchYouTubeTimedText(videoId: string, lang = 'en'): Promise<TranscriptSegment[]> {
  const url = `https://video.google.com/timedtext?lang=${encodeURIComponent(lang)}&v=${encodeURIComponent(videoId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch transcript: ${res.status}`);
  const xml = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const nodes = Array.from(doc.getElementsByTagName('text'));
  return nodes.map(node => ({
    start: safeParseFloat(node.getAttribute('start') || '0'),
    dur: safeParseFloat(node.getAttribute('dur') || '0'),
    text: decodeHTMLEntities(node.textContent || ''),
  }));
}

function decodeHTMLEntities(input: string): string {
  const d = document.createElement('div');
  d.innerHTML = input.replace(/\n/g, ' ');
  return d.textContent || '';
}

export async function getTranscriptForCourse(courseId: string, videoUrl: string): Promise<TranscriptSegment[] | null> {
  try {
    const cached = localStorage.getItem(getCacheKey(courseId));
    if (cached) {
      const arr = JSON.parse(cached);
      if (Array.isArray(arr)) return arr;
    }
  } catch {}

  const ytId = extractYouTubeId(videoUrl);
  let segments: TranscriptSegment[] | null = null;
  try {
    if (ytId) {
      segments = await fetchYouTubeTimedText(ytId);
    }
  } catch {}

  if (segments && segments.length > 0) {
    try { localStorage.setItem(getCacheKey(courseId), JSON.stringify(segments)); } catch {}
    return segments;
  }

  return null;
}

export function transcriptToPlainText(segments: TranscriptSegment[]): string {
  return segments.map(s => s.text.trim()).filter(Boolean).join(' ');
}

