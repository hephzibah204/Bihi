import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useAI } from '../hooks/useAI';
import { apiGetStudents, apiGetScores, apiGetSubjects, apiGetSchoolSettings, apiGetTeachers, apiGetTimetableData } from '../services/api';
import SparklesIcon from './icons/SparklesIcon';
import HtmlContent from './HtmlContent';
import SpinnerIcon from './icons/SpinnerIcon';

const AnalystQAWidget: React.FC = () => {
  const { generateResponseStream, status } = useAI();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loadingContext, setLoadingContext] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [context, setContext] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingContext(true);
      try {
        const [students, scores, subjects, settings, teachers, timetable] = await Promise.all([
          apiGetStudents(),
          apiGetScores(),
          apiGetSubjects(),
          apiGetSchoolSettings(),
          apiGetTeachers(),
          apiGetTimetableData(),
        ]);

        const studentSummary = (students || []).map(s => ({ id: s.id, name: s.name, class: (s as any).class }));
        const scoreSummary = (scores || []).map(s => ({
          studentId: s.studentId,
          subjectId: s.subjectId,
          session: s.session,
          term: s.term,
          total: (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0),
        }));
        const subjectSummary = (subjects || []).map(s => ({ id: s.id, name: (s as any).name || (s as any).title || s.id }));
        const teacherSummary = (teachers || []).map(t => ({ id: t.id, name: t.name }));

        setContext({
          gradingSystem: (settings as any)?.gradingSystem,
          students: studentSummary,
          scores: scoreSummary,
          subjects: subjectSummary,
          teachers: teacherSummary,
          timetable,
        });
      } catch (e) {
        setError('Failed to load context for AI analysis.');
      } finally {
        setLoadingContext(false);
      }
    };
    load();
  }, []);

  const handleAsk = async () => {
    if (!String(query).trim()) return;
    setIsAnalyzing(true);
    setError('');
    setAnswer('');
    try {
      const prompt = `
        You are a helpful school data analyst. Answer the user's question using the provided JSON context.

        Rules:
        - Be concise and precise.
        - If listing or comparing, format the details in a simple markdown table.
        - Consider sessions and terms when discussing trends.

        CONTEXT JSON:
        ${JSON.stringify(context)}

        USER QUESTION:
        "${query}"
      `;

      const acc = useRef('');
      await generateResponseStream({
        prompt,
        context: JSON.stringify(context),
        onChunk: (chunk) => { acc.current += String(chunk || ''); setAnswer(acc.current); }
      });
    } catch (e: any) {
      setError(`AI Error: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">Analyst Q&A</h3>
            <p className="text-sm text-gray-500">Ask anything about your school's performance.</p>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full mr-2 ${status === 'gemini' ? 'bg-green-500' : status === 'loading' ? 'bg-yellow-500' : 'bg-yellow-500'}`}></span>
            {status === 'gemini' ? 'Online' : status === 'loading' ? 'Thinking' : 'Offline'}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input-field flex-1"
            placeholder="Ask anything about your school's performance..."
            disabled={loadingContext}
          />
          <button className="btn btn-primary" onClick={handleAsk} disabled={isAnalyzing || loadingContext}>
            {isAnalyzing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
            <span className="ml-2">{isAnalyzing ? 'Analyzing...' : 'Ask'}</span>
          </button>
        </div>

        {loadingContext && (
          <p className="mt-3 text-xs text-gray-500">Loading context...</p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
{answer && (
          <div className="mt-4 border-t pt-4">
<HtmlContent html={answer} className="bg-gray-50 p-4 rounded-md" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalystQAWidget;
