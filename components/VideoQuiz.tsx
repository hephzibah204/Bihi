import React, { useEffect, useMemo, useState } from 'react';
import { getTranscriptForCourse, transcriptToPlainText } from '../services/videoTranscript';
import { callGeminiApi } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import CheckIcon from './icons/CheckIcon';

type QuizItem = {
  question: string;
  options: { [key: string]: string };
  answer: string;
};

type Props = {
  courseId: string;
  title: string;
  description: string;
  videoUrl: string;
};

function getAttemptsKey(courseId: string) {
  return `coach_quiz_attempts_${courseId}`;
}

const VideoQuiz: React.FC<Props> = ({ courseId, title, description, videoUrl }) => {
  const [numQuestions, setNumQuestions] = useState(5);
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<QuizItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [graded, setGraded] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const segs = await getTranscriptForCourse(courseId, videoUrl);
        if (!mounted) return;
        if (segs && segs.length > 0) {
          setTranscriptText(transcriptToPlainText(segs));
        } else {
          const prompt = `Summarize the following teacher training video content as plain text suitable for generating quiz questions. Title: ${title}. Description: ${description}.`;
          const text = await callGeminiApi(prompt, { responseMimeType: 'text/plain' });
          if (!mounted) return;
          setTranscriptText(String(text).trim());
        }
      } catch {}
    };
    run();
    return () => { mounted = false; };
  }, [courseId, videoUrl, title, description]);

  const handleGenerate = async () => {
    if (!transcriptText) {
      setError('Transcript unavailable. Please try again later.');
      return;
    }
    setLoading(true);
    setError('');
    setItems([]);
    setAnswers({});
    setGraded(false);
    setScore(0);

    const prompt = `Create ${numQuestions} multiple choice questions (A-D) based strictly on the transcript below. Provide a valid JSON object only.
Transcript:
${transcriptText}

Return JSON: { "quiz": [ { "question": "string", "options": { "A": "string", "B": "string", "C": "string", "D": "string" }, "answer": "A|B|C|D" } ] }`;

    try {
      const expectedSchema = {
        quiz: [ { question: 'string', options: { A: 'string', B: 'string', C: 'string', D: 'string' }, answer: 'string' } ]
      };
      const text = await callGeminiApi(prompt, { responseMimeType: 'application/json', expectedSchema });
      const clean = String(text).trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
      const json = JSON.parse(clean);
      if (!json.quiz || !Array.isArray(json.quiz) || json.quiz.length === 0) throw new Error('Empty quiz');
      setItems(json.quiz);
    } catch (e: any) {
      setError((e?.message && String(e.message)) || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (i: number, opt: string) => {
    setAnswers(a => ({ ...a, [i]: opt }));
  };

  const gradeQuiz = () => {
    let correct = 0;
    items.forEach((it, idx) => {
      const pick = answers[idx];
      if (pick && pick.toUpperCase() === (it.answer || '').toUpperCase()) correct += 1;
    });
    setScore(correct);
    setGraded(true);
    try {
      const key = getAttemptsKey(courseId);
      const raw = localStorage.getItem(key);
      const attempts = raw ? JSON.parse(raw) : [];
      attempts.push({ at: new Date().toISOString(), total: items.length, score: correct });
      localStorage.setItem(key, JSON.stringify(attempts));
    } catch {}
  };

  const percent = useMemo(() => {
    if (!graded || items.length === 0) return 0;
    return Math.round((score / items.length) * 100);
  }, [graded, score, items.length]);

  return (
    <div className="bg-white rounded-lg shadow p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <SparklesIcon className="h-5 w-5 mr-2" />
          <h4 className="font-semibold">Quiz From Video</h4>
        </div>
        <div className="text-xs text-gray-500">MCQ, auto-graded</div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <label className="text-sm">Questions</label>
        <input type="number" min={1} max={20} value={numQuestions} onChange={e => setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value || '0') || 1)))} className="border rounded px-2 py-1 w-20" />
        <button onClick={handleGenerate} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded" disabled={loading}>
          {loading ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
          <span>{loading ? 'Generating...' : 'Generate'}</span>
        </button>
      </div>
      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      {items.length > 0 && (
        <div className="mt-4 space-y-4">
          {items.map((it, idx) => (
            <div key={idx} className="border rounded p-3">
              <div className="font-medium text-sm">{idx + 1}. {it.question}</div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(it.options).map(([k, v]) => (
                  <button key={k} onClick={() => selectAnswer(idx, k)} className={`text-left border rounded px-2 py-2 ${answers[idx] === k ? 'bg-indigo-50 border-indigo-400' : 'hover:bg-gray-50'}`}>
                    <span className="font-semibold mr-2">{k}.</span>{v}
                  </button>
                ))}
              </div>
              {graded && (
                <div className="mt-2 text-xs">
                  <span className={`mr-2 ${answers[idx]?.toUpperCase() === it.answer.toUpperCase() ? 'text-green-600' : 'text-red-600'}`}>{answers[idx] ? (answers[idx] === it.answer ? 'Correct' : 'Wrong') : 'No answer'}</span>
                  <span className="text-gray-600">Answer: {it.answer}</span>
                </div>
              )}
            </div>
          ))}
          {!graded ? (
            <button onClick={gradeQuiz} className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded">
              <CheckIcon className="h-4 w-4" />
              <span>Grade Quiz</span>
            </button>
          ) : (
            <div className="text-sm font-semibold">Score: {score}/{items.length} ({percent}%)</div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoQuiz;

