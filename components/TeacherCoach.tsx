import React, { useMemo, useState } from 'react';
import { listMicroCourses, normalizeToYouTubeEmbed, markCourseCompleted } from '../services/teacherCoach';
import { USER_ROLES } from '../utils/constants';
import { getPracticeEvents } from '../services/telemetry';
import DocumentTextIcon from './icons/DocumentTextIcon';

const TeacherCoach: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const courses = useMemo(() => {
    const all = listMicroCourses();
    return all.filter(c => (c.status || 'draft') === 'published' && (c.visibleRoles || []).includes(USER_ROLES.TEACHER));
  }, []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.skills.some(s => s.toLowerCase().includes(q))
    );
  }, [query, courses]);

  const selected = selectedId ? filtered.find(c => c.id === selectedId) ?? filtered[0] : filtered[0];

  const recommendations = useMemo(() => {
    const events = getPracticeEvents();
    const titles = new Set<string>();
    events.forEach(ev => {
      const t = ev.payload?.title?.toLowerCase?.();
      const tid = ev.payload?.templateId;
      if (t) titles.add(t);
      if (tid) titles.add(String(tid).toLowerCase());
    });
    const picks: string[] = [];
    // Simple heuristic mapping based on lesson template signals
    const hasPBL = Array.from(titles).some(s => s.includes('project-based') || s.includes('pbl') || s.includes('project-based-learning'));
    const hasFlipped = Array.from(titles).some(s => s.includes('flipped'));
    const hasDesignThinking = Array.from(titles).some(s => s.includes('design-thinking') || s.includes('design thinking'));
    if (hasPBL) picks.push('pbl-foundations');
    if (hasFlipped) picks.push('blended-learning');
    if (hasDesignThinking) picks.push('differentiation-basics');
    // Ensure unique and available
    const uniqueIds = Array.from(new Set(picks));
    return courses.filter(c => uniqueIds.includes(c.id));
  }, [courses]);

  const handleComplete = () => {
    if (!selected) return;
    markCourseCompleted(selected.id);
    // Award a simple badge based on course id
    try {
      const key = 'teacher_badges';
      const raw = localStorage.getItem(key);
      const badges = raw ? JSON.parse(raw) : [];
      let badge: { id: string; label: string } | null = null;
      if (selected.id === 'pbl-foundations') badge = { id: 'badge_pbl_practitioner_i', label: 'PBL Practitioner I' };
      else if (selected.id === 'formative-assessment') badge = { id: 'badge_assessment_i', label: 'Assessment Basics I' };
      else if (selected.id === 'differentiation-basics') badge = { id: 'badge_udl_i', label: 'UDL & Differentiation I' };
      else if (selected.id === 'blended-learning') badge = { id: 'badge_blended_i', label: 'Blended Learning I' };
      else if (selected.id === 'vimeo-classroom-engagement') badge = { id: 'badge_engagement_i', label: 'Engagement Tactics I' };
      if (badge && !badges.some((b: any) => b.id === badge!.id)) {
        badges.push({ ...badge, awardedAt: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(badges));
      }
    } catch {}
    alert('Marked as completed. Great job!');
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center">
          <DocumentTextIcon className="h-6 w-6 mr-2" />
          AI Coach & Teacher Training
        </h2>
        <div className="text-sm text-gray-500">Micro-courses with embedded videos (YouTube)</div>
      </div>

      <div className="flex gap-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search courses by topic or skill (e.g., PBL, assessment)"
          className="flex-1 border rounded px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {selected ? (
            <div className="bg-white rounded-lg shadow p-3">
              <h3 className="text-lg font-semibold">{selected.title}</h3>
              <p className="text-sm text-gray-600">{selected.description}</p>
              <div className="mt-3">
                <div className="aspect-video w-full">
                  <iframe
                    className="w-full h-full rounded"
                    src={normalizeToYouTubeEmbed(selected.videoUrl)}
                    title={selected.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={handleComplete} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded">
                  <DocumentTextIcon className="h-5 w-5" />
                  Mark Completed
                </button>
                <a
                  href={selected.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-2 rounded"
                >
                  Open on YouTube
                </a>
                {selected.durationMinutes && (
                  <span className="text-xs text-gray-500">~{selected.durationMinutes} min</span>
                )}
              </div>
              <div className="mt-2">
                <div className="text-xs text-gray-500">Skills: {selected.skills.join(', ')}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No courses match your search.</div>
          )}
        </div>

        <aside className="space-y-2">
          <div className="bg-white rounded-lg shadow p-3">
            <h4 className="font-semibold mb-2">Browse Micro-Courses</h4>
            <div className="space-y-1">
              {filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left px-2 py-1 rounded ${selected?.id === c.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100'}`}
                >
                  <div className="text-sm font-medium">{c.title}</div>
                  <div className="text-xs text-gray-500">{c.skills.join(', ')}</div>
                </button>
              ))}
            </div>
          </div>
          {recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-3">
              <h4 className="font-semibold mb-2">Recommended For You</h4>
              <div className="space-y-1">
                {recommendations.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left px-2 py-1 rounded ${selected?.id === c.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100'}`}
                  >
                    <div className="text-sm font-medium">{c.title}</div>
                    <div className="text-xs text-gray-500">{c.skills.join(', ')}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="bg-white rounded-lg shadow p-3">
            <h4 className="font-semibold mb-2">Your Badges</h4>
            <BadgesList />
          </div>
          <div className="bg-white rounded-lg shadow p-3">
            <h4 className="font-semibold mb-2">Tips</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>Pair viewing with a quick reflection or classroom try-out.</li>
              <li>Bookmark relevant courses for later reuse.</li>
              <li>Share with colleagues to build collective capacity.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

const BadgesList: React.FC = () => {
  try {
    const raw = localStorage.getItem('teacher_badges');
    const badges: Array<{ id: string; label: string; awardedAt?: string }> = raw ? JSON.parse(raw) : [];
    if (badges.length === 0) return <div className="text-sm text-gray-500">No badges yet. Complete courses to earn badges.</div>;
    return (
      <ul className="space-y-1">
        {badges.map(b => (
          <li key={b.id} className="text-sm flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs">Badge</span>
            <span className="font-medium">{b.label}</span>
            {b.awardedAt && <span className="text-xs text-gray-500">{new Date(b.awardedAt).toLocaleDateString()}</span>}
          </li>
        ))}
      </ul>
    );
  } catch (e) {
    return <div className="text-sm text-gray-500">Unable to load badges.</div>;
  }
};

export default TeacherCoach;