import React, { useEffect, useMemo, useState } from 'react';
import { getTranscriptForCourse, transcriptToPlainText, TranscriptSegment } from '../services/videoTranscript';
import { callGeminiApi } from '../services/geminiService';
import DocumentTextIcon from './icons/DocumentTextIcon';
import SpinnerIcon from './icons/SpinnerIcon';

type Props = {
  courseId: string;
  title: string;
  description: string;
  videoUrl: string;
};

const VideoTranscriptPanel: React.FC<Props> = ({ courseId, title, description, videoUrl }) => {
  const [segments, setSegments] = useState<TranscriptSegment[] | null>(null);
  const [aiTranscript, setAiTranscript] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError('');
      setSegments(null);
      setAiTranscript('');
      try {
        const segs = await getTranscriptForCourse(courseId, videoUrl);
        if (!mounted) return;
        if (segs && segs.length > 0) {
          setSegments(segs);
        } else {
          const prompt = `You are an expert instructional assistant. Produce a detailed transcript-style summary for a teacher training video.
Title: ${title}
Description: ${description}
Return a single plain text transcript in first-person narration with time-agnostic paragraphs. Avoid headings and bullet points.`;
          const text = await callGeminiApi(prompt, { responseMimeType: 'text/plain' });
          if (!mounted) return;
          setAiTranscript(String(text).trim());
        }
      } catch (e: any) {
        if (!mounted) return;
        setError((e?.message && String(e.message)) || 'Unable to load transcript');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [courseId, videoUrl, title, description]);

  const plainText = useMemo(() => {
    if (segments && segments.length > 0) return transcriptToPlainText(segments);
    return aiTranscript;
  }, [segments, aiTranscript]);

  const [copied, setCopied] = useState(false);
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(plainText || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="bg-white rounded-lg shadow p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          <h4 className="font-semibold">Transcript</h4>
        </div>
        <button onClick={copyText} className="text-xs px-2 py-1 rounded bg-gray-100">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {loading && (
        <div className="mt-3 text-sm text-gray-500 flex items-center">
          <SpinnerIcon className="h-4 w-4 mr-2 animate-spin" />
          Loading transcript...
        </div>
      )}
      {!loading && error && (
        <div className="mt-3 text-sm text-red-600">{error}</div>
      )}
      {!loading && !error && (
        <div className="mt-3 text-sm whitespace-pre-wrap leading-relaxed">{plainText || 'Transcript unavailable.'}</div>
      )}
    </div>
  );
};

export default VideoTranscriptPanel;

