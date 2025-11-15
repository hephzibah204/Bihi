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
  if (!res.ok) throw new Error(String(res.status));
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

type CaptionTrack = {
  id: string;
  lang_code: string;
  name?: string;
  kind?: string;
  is_default?: boolean;
};

async function fetchYouTubeCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
  const url = `https://video.google.com/timedtext?type=list&v=${encodeURIComponent(videoId)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const xml = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const tracks = Array.from(doc.getElementsByTagName('track'));
  return tracks.map(t => ({
    id: String(t.getAttribute('id') || ''),
    lang_code: String(t.getAttribute('lang_code') || ''),
    name: t.getAttribute('name') || undefined,
    kind: t.getAttribute('kind') || undefined,
    is_default: String(t.getAttribute('lang_default') || '').toLowerCase() === 'true',
  })).filter(tr => tr.id);
}

async function fetchYouTubeTimedTextByTrack(videoId: string, track: CaptionTrack): Promise<TranscriptSegment[]> {
  const url = `https://video.google.com/timedtext?v=${encodeURIComponent(videoId)}&id=${encodeURIComponent(track.id)}&lang=${encodeURIComponent(track.lang_code)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
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

function pickBestTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;
  const pref = (typeof navigator !== 'undefined' ? navigator.language : 'en').toLowerCase();
  const prefShort = pref.split('-')[0];
  const byExact = tracks.find(t => t.lang_code.toLowerCase() === pref);
  if (byExact) return byExact;
  const byShort = tracks.find(t => t.lang_code.toLowerCase() === prefShort);
  if (byShort) return byShort;
  const en = tracks.find(t => t.lang_code.toLowerCase().startsWith('en'));
  if (en) return en;
  const def = tracks.find(t => t.is_default);
  if (def) return def;
  return tracks[0];
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
      if (!segments || segments.length === 0) {
        const tracks = await fetchYouTubeCaptionTracks(ytId);
        const best = pickBestTrack(tracks);
        if (best) {
          segments = await fetchYouTubeTimedTextByTrack(ytId, best);
        }
      }
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
