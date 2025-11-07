import React, { useEffect, useMemo, useState } from 'react';
import { apiGetScores, apiGetStudents } from '../services/api';
import { Student, Score } from '../types';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { callGeminiApi } from '../services/geminiService';
import { normalizeAIText } from '../utils/aiNormalize';

const ParentMessageComposer: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [tone, setTone] = useState('Supportive');
  const [includeActionSteps, setIncludeActionSteps] = useState(true);
  const [messageHtml, setMessageHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const list = await apiGetStudents();
        setStudents(list);
        if (list.length > 0) setSelectedStudentId(list[0].id);
      } catch (e) {
        setError('Failed to load students.');
      }
    };
    load();
  }, []);

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

  const handleGenerate = async () => {
    if (!selectedStudentId) {
      setError('Please select a student.');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessageHtml('');

    try {
      const [scores] = await Promise.all([
        apiGetScores({ studentIds: [selectedStudentId] }),
      ]);

      const scoreSummary = scores.map((score: Score) => {
        const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
        return `${score.subjectId}: ${total}%`;
      }).join(', ');

      const prompt = `You are a professional Nigerian teacher writing to a parent/guardian about their child's recent performance.
Preferences:
- Student: ${selectedStudent?.name || 'the student'} (${selectedStudent?.class || ''})
- Tone: ${tone}
- Include Practical Action Steps: ${includeActionSteps ? 'Yes' : 'No'}
- Performance Summary: ${scoreSummary || 'No scores available.'}

Constraints:
- 100–180 words.
- Return only HTML using <p> and, if steps are included, a single <ul> with 2–3 <li>.
- No extra commentary before or after the HTML.
- Use only information provided above; no generic disclaimers.
`;

      const result = await callGeminiApi(prompt, { responseMimeType: 'text/html' });
      setMessageHtml(normalizeAIText(result));
    } catch (err) {
      const msg = (err as any)?.message || String(err);
      setError(`Failed to generate message: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="w-6 h-6 mr-3 text-pink-500" />
            <h2 className="text-xl font-semibold">AI Parent Message Composer</h2>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Draft thoughtful messages to parents based on recent performance.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Select Student</label>
            <select className="input-field" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} disabled={students.length === 0}>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tone</label>
            <select className="input-field" value={tone} onChange={e => setTone(e.target.value)}>
              <option>Supportive</option>
              <option>Neutral</option>
              <option>Formal</option>
            </select>
          </div>
          <div>
            <label className="inline-flex items-center space-x-2 mt-2">
              <input type="checkbox" checked={includeActionSteps} onChange={e => setIncludeActionSteps(e.target.checked)} />
              <span>Include Practical Action Steps</span>
            </label>
          </div>
        </div>

        <button onClick={handleGenerate} className="btn btn-primary mt-4" disabled={isLoading || !selectedStudentId}>
          {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
          <span className="ml-2">{isLoading ? 'Generating...' : 'Compose Message'}</span>
        </button>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {messageHtml && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
        <div className="prose-content" dangerouslySetInnerHTML={{ __html: require('../utils/sanitize').safeHtml(messageHtml) }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentMessageComposer;