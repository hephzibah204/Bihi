import React, { useEffect, useMemo, useState } from 'react';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';
import type { LessonTemplate, LessonPlan } from '../types/academic';
import { DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { emitPracticeEvent } from '../services/telemetry';

type PillarKey = 'collaboration' | 'creativity' | 'technology';

const templateFiles = [
  () => import('../plans/lesson-templates/design-thinking.json'),
  () => import('../plans/lesson-templates/flipped-classroom.json'),
  () => import('../plans/lesson-templates/project-based-learning.json'),
];

function loadTemplates(): Promise<LessonTemplate[]> {
  return Promise.all(templateFiles.map((loader) => loader().then((m) => m.default as LessonTemplate)));
}

export default function LessonTemplates() {
  const { isLoading, hasFeature } = usePlanFeatures();
  const [templates, setTemplates] = useState<LessonTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<LessonTemplate | null>(null);
  const [planTitle, setPlanTitle] = useState('');
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [pillarConfirmations, setPillarConfirmations] = useState<Record<PillarKey, boolean>>({
    collaboration: false,
    creativity: false,
    technology: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates()
      .then(setTemplates)
      .catch(() => setError('Failed to load templates.'));
  }, []);

  const pillarsRequired: PillarKey[] = useMemo(() => ['collaboration', 'creativity', 'technology'], []);

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-gray-600">Loading plan features…</p>
      </div>
    );
  }

  if (!hasFeature('lesson-templates')) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-amber-600">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <p>
            Lesson Templates are not enabled for your plan. Please upgrade or contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const resetWizard = () => {
    setPlanTitle('');
    setStepNotes({});
    setPillarConfirmations({ collaboration: false, creativity: false, technology: false });
    setSavedMessage(null);
    setError(null);
  };

  const startTemplate = (t: LessonTemplate) => {
    setActiveTemplate(t);
    resetWizard();
    setPlanTitle(t.title);
  };

  const validate = (): string | null => {
    if (!activeTemplate) return 'No template selected';
    if (!planTitle.trim()) return 'Please enter a plan title.';
    // Confirm all three pillars
    for (const key of pillarsRequired) {
      if (!pillarConfirmations[key]) {
        return `Please confirm how you will address ${key}.`;
      }
    }
    // Require notes for steps with required pillars
    for (const step of activeTemplate.steps) {
      if (step.requiredPillars && step.requiredPillars.length > 0) {
        const note = (stepNotes[step.id] || '').trim();
        if (!note) {
          return `Add notes for step: ${step.title}.`;
        }
      }
    }
    return null;
  };

  const savePlan = () => {
    const v = validate();
    if (v) {
      setError(v);
      setSavedMessage(null);
      return;
    }
    if (!activeTemplate) return;
    const plan: LessonPlan = {
      id: `plan_${Date.now()}`,
      templateId: activeTemplate.id,
      title: planTitle.trim(),
      objectives: [],
      steps: activeTemplate.steps.map((s) => ({ id: s.id, notes: stepNotes[s.id] || '', completed: false })),
      createdByTeacherId: 'demo-teacher',
      createdAt: new Date().toISOString(),
    };
    try {
      const key = 'lesson_plans';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(plan);
      localStorage.setItem(key, JSON.stringify(existing));
      emitPracticeEvent('lesson_plan_saved', { templateId: activeTemplate.id, title: plan.title });
      setSavedMessage('Lesson plan saved locally.');
      setError(null);
    } catch (e) {
      setError('Failed to save lesson plan.');
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
        <h2 className="text-xl font-semibold">21st-Century Classroom Templates</h2>
      </div>

      {!activeTemplate && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <button
              key={t.id}
              className="text-left border rounded-lg p-4 hover:border-indigo-400"
              onClick={() => startTemplate(t)}
            >
              <div className="font-medium">{t.title}</div>
              <div className="text-sm text-gray-600 mt-1">{t.description}</div>
              {t.suggestedDurationMinutes && (
                <div className="text-xs text-gray-500 mt-2">Suggested: {t.suggestedDurationMinutes} min</div>
              )}
            </button>
          ))}
        </div>
      )}

      {activeTemplate && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{activeTemplate.title}</div>
              <div className="text-sm text-gray-600">{activeTemplate.description}</div>
            </div>
            <button className="text-sm text-indigo-600" onClick={() => setActiveTemplate(null)}>Back to templates</button>
          </div>

          <div>
            <label className="block text-sm font-medium">Plan Title</label>
            <input
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              className="mt-1 w-full border rounded p-2"
              placeholder="Enter a title for your plan"
            />
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Pillar Confirmations</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {pillarsRequired.map((p) => (
                <label key={p} className="flex items-center gap-2 border rounded p-2">
                  <input
                    type="checkbox"
                    checked={pillarConfirmations[p]}
                    onChange={(e) => setPillarConfirmations((prev) => ({ ...prev, [p]: e.target.checked }))}
                  />
                  <span className="capitalize">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {activeTemplate.steps.map((s) => (
              <div key={s.id} className="border rounded p-3">
                <div className="font-medium">{s.title}</div>
                <div className="text-sm text-gray-600">{s.guidance}</div>
                {s.requiredPillars && s.requiredPillars.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Requires: {s.requiredPillars.map((rp) => rp).join(', ')}
                  </div>
                )}
                <textarea
                  value={stepNotes[s.id] || ''}
                  onChange={(e) => setStepNotes((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  className="mt-2 w-full border rounded p-2"
                  placeholder={`Notes for ${s.title}`}
                  rows={3}
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          {savedMessage && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircleIcon className="h-5 w-5" />
              <span>{savedMessage}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded" onClick={savePlan}>Save Plan</button>
            <button className="border px-4 py-2 rounded" onClick={resetWizard}>Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}