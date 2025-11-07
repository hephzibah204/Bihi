import React, { useEffect, useMemo, useState } from 'react';
import { apiGetSubjects } from '../services/api';
import { Subject } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { generateResponse as aiGenerateResponse } from '../services/geminiAIService';
import { normalizeAIText } from '../utils/aiNormalize';

const defaultCriteria = [
  'Understanding of Topic',
  'Accuracy and Correctness',
  'Clarity of Presentation',
  'Creativity or Insight',
  'Effort and Completeness'
];

const RubricGenerator: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [topic, setTopic] = useState('');
  const [criteria, setCriteria] = useState<string[]>(defaultCriteria);
  const [rubricHtml, setRubricHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const subs = await apiGetSubjects();
        setSubjects(subs);
        const allClasses = [...new Set(subs.flatMap(s => s.classes))].sort();
        setClasses(allClasses);
        if (allClasses.length > 0) setSelectedClass(allClasses[0]);
      } catch (e) {
        setError('Failed to load subjects.');
      }
    };
    load();
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return [];
    return subjects.filter(s => s.classes.includes(selectedClass));
  }, [selectedClass, subjects]);

  useEffect(() => {
    if (filteredSubjects.length > 0) {
      if (!filteredSubjects.some(s => s.id === selectedSubjectId)) {
        setSelectedSubjectId(filteredSubjects[0].id);
      }
    } else {
      setSelectedSubjectId('');
    }
  }, [filteredSubjects, selectedSubjectId]);

  const updateCriterion = (index: number, value: string) => {
    const next = [...criteria];
    next[index] = value;
    setCriteria(next);
  };

  const addCriterion = () => setCriteria(prev => [...prev, '']);
  const removeCriterion = (index: number) => setCriteria(prev => prev.filter((_, i) => i !== index));

  const handleGenerate = async () => {
    if (!selectedClass || !selectedSubjectId || !topic) {
      setError('Please select class, subject, and enter a topic.');
      return;
    }
    setIsLoading(true);
    setError('');
    setRubricHtml('');

    const subjectName = subjects.find(s => s.id === selectedSubjectId)?.name || '';
    const criteriaList = criteria.filter(c => c.trim().length > 0);

    const prompt = `
      You are a seasoned Nigerian teacher. Create a clear, practical grading rubric for the following assignment:
      - Subject: ${subjectName}
      - Class Level: ${selectedClass}
      - Topic: ${topic}
      - Criteria: ${criteriaList.join('; ')}

      Return the rubric as a single HTML table (<table>) with columns:
      Criteria | Excellent (A) | Good (B) | Fair (C) | Needs Improvement (D/E)
      Make descriptions short, specific, and observable. Do not include any extra text outside the table.
    `;

    try {
      const result = await aiGenerateResponse(prompt);
      setRubricHtml(normalizeAIText(result));
    } catch (err) {
      const msg = (err as any)?.message || String(err);
      setError(`Failed to generate rubric: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <ClipboardListIcon className="w-6 h-6 mr-3 text-indigo-500" />
            <h2 className="text-xl font-semibold">AI Rubric Generator</h2>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Quickly generate a clear grading rubric tailored to your class and topic.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Class</label>
            <select className="input-field" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} disabled={classes.length === 0}>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <select className="input-field" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} disabled={filteredSubjects.length === 0}>
              {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Topic / Assignment Focus</label>
            <input type="text" className="input-field" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Photosynthesis lab report"/>
          </div>
        </div>

        <div className="mt-4">
          <label className="label">Criteria</label>
          <div className="space-y-2">
            {criteria.map((c, i) => (
              <div key={i} className="flex items-center space-x-2">
                <input type="text" className="input-field flex-1" value={c} onChange={e => updateCriterion(i, e.target.value)} />
                <button className="btn btn-secondary" onClick={() => removeCriterion(i)}>Remove</button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={addCriterion}>Add Criterion</button>
          </div>
        </div>

        <button onClick={handleGenerate} className="btn btn-primary mt-4" disabled={isLoading || !topic}>
          {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
          <span className="ml-2">{isLoading ? 'Generating...' : 'Generate Rubric'}</span>
        </button>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {rubricHtml && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md overflow-x-auto">
      <div className="prose-content" dangerouslySetInnerHTML={{ __html: require('../utils/sanitize').safeHtml(rubricHtml) }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RubricGenerator;