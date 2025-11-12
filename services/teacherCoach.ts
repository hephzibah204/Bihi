// services/teacherCoach.ts
export type MicroCourse = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  skills: string[];
  durationMinutes?: number;
  provider?: string;
  status?: 'draft' | 'published';
  visibleRoles?: string[]; // e.g., ['Admin','Teacher']
  categories?: string[];
  tags?: string[];
};

// Initial seed catalog used on first load. Admins can manage and override.
const INITIAL_CATALOG: MicroCourse[] = [
  {
    id: 'pbl-foundations',
    title: 'Project-Based Learning Foundations',
    description: 'Core concepts, planning steps, and assessment strategies for PBL.',
    // Verified: Project-Based Learning Explained (Common Craft / PBLWorks)
    // Source: https://my.pblworks.org/resource/video/project_based_learning_explained
    videoUrl: 'https://www.youtube.com/watch?v=LMCZvGesRz8',
    skills: ['PBL', 'Assessment', 'Collaboration'],
    durationMinutes: 12,
    provider: 'YouTube',
    status: 'published',
    visibleRoles: ['Admin','Teacher'],
  },
  {
    id: 'classroom-management',
    title: 'Effective Classroom Management Strategies',
    description: 'Positive routines, attention signals, and engagement techniques.',
    // Verified: Edutopia Sessions: Classroom Management for New Teachers
    // Source: https://www.youtube.com/watch?v=mTBky3sQDH0
    videoUrl: 'https://www.youtube.com/watch?v=mTBky3sQDH0',
    skills: ['Classroom Management', 'Engagement'],
    durationMinutes: 10,
    provider: 'YouTube',
    status: 'published',
    visibleRoles: ['Admin','Teacher'],
  },
  {
    id: 'formative-assessment',
    title: 'Formative Assessment in Practice',
    description: 'Quick checks for understanding and feedback loops.',
    // Verified: Dylan Wiliam — Embedding Formative Assessment (SSAT/EEF)
    // Source: https://www.youtube.com/watch?v=zwGaG1b_T2w
    videoUrl: 'https://www.youtube.com/watch?v=zwGaG1b_T2w',
    skills: ['Assessment', 'Feedback'],
    durationMinutes: 9,
    provider: 'YouTube',
    status: 'published',
    visibleRoles: ['Admin','Teacher'],
  },
  {
    id: 'differentiation-basics',
    title: 'Differentiated Instruction Basics',
    description: 'Adapting content, process, and product to learner needs.',
    videoUrl: 'https://www.youtube.com/watch?v=7v9u4rP2m9M',
    skills: ['Differentiation', 'Universal Design'],
    durationMinutes: 8,
    provider: 'YouTube',
    status: 'published',
    visibleRoles: ['Admin','Teacher'],
  },
  {
    id: 'blended-learning',
    title: 'Blended Learning Essentials',
    description: 'Mixing online and in-person modalities effectively.',
    videoUrl: 'https://www.youtube.com/watch?v=Gna6l3iDGqU',
    skills: ['Technology Integration', 'Instructional Design'],
    durationMinutes: 11,
    provider: 'YouTube',
    status: 'published',
    visibleRoles: ['Admin','Teacher'],
  },
  {
    id: 'vimeo-classroom-engagement',
    title: 'Classroom Engagement Tactics (Vimeo)',
    description: 'Practical ways to boost engagement and participation.',
    videoUrl: 'https://vimeo.com/76979871',
    skills: ['Engagement', 'Classroom Management'],
    durationMinutes: 4,
    provider: 'Vimeo',
    status: 'published',
    visibleRoles: ['Admin','Teacher'],
  },
];

const CATALOG_KEY = 'coachCatalog';

export function getCoachCatalog(): MicroCourse[] {
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((c: MicroCourse) => ({
        ...c,
        status: c.status ?? 'published',
        visibleRoles: c.visibleRoles ?? ['Admin','Teacher'],
        categories: c.categories ?? [],
        tags: c.tags ?? [],
      }));
    }
    // Seed on first access
    localStorage.setItem(CATALOG_KEY, JSON.stringify(INITIAL_CATALOG));
    return INITIAL_CATALOG.slice().map((c: MicroCourse) => ({
      ...c,
      status: c.status ?? 'published',
      visibleRoles: c.visibleRoles ?? ['Admin','Teacher'],
      categories: c.categories ?? [],
      tags: c.tags ?? [],
    }));
  } catch {
    return INITIAL_CATALOG.slice().map((c: MicroCourse) => ({
      ...c,
      status: c.status ?? 'published',
      visibleRoles: c.visibleRoles ?? ['Admin','Teacher'],
      categories: c.categories ?? [],
      tags: c.tags ?? [],
    }));
  }
}

export function saveCoachCatalog(catalog: MicroCourse[]): void {
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));
  } catch {}
}

export function upsertCourse(course: MicroCourse): MicroCourse[] {
  const catalog = getCoachCatalog();
  const idx = catalog.findIndex(c => c.id === course.id);
  if (idx >= 0) catalog[idx] = course; else catalog.push(course);
  saveCoachCatalog(catalog);
  return catalog;
}

export function deleteCourse(id: string): MicroCourse[] {
  const catalog = getCoachCatalog().filter(c => c.id !== id);
  saveCoachCatalog(catalog);
  return catalog;
}

export function listMicroCourses(): MicroCourse[] {
  return getCoachCatalog();
}

export function listVisibleMicroCoursesForRole(role: string, includeDraft = false): MicroCourse[] {
  const catalog = getCoachCatalog();
  return catalog.filter(c => {
    const statusOk = includeDraft ? true : (c.status ?? 'published') === 'published';
    const roleOk = (c.visibleRoles ?? ['Admin','Teacher']).includes(role);
    return statusOk && roleOk;
  });
}

export function exportCoachCatalog(): string {
  try {
    return JSON.stringify(getCoachCatalog(), null, 2);
  } catch {
    return '[]';
  }
}

export function importCoachCatalog(payload: MicroCourse[] | string, mode: 'replace' | 'merge' = 'replace'): MicroCourse[] {
  try {
    const incoming = typeof payload === 'string' ? JSON.parse(payload) : payload;
    if (!Array.isArray(incoming)) return getCoachCatalog();
    if (mode === 'replace') {
      saveCoachCatalog(incoming);
      return getCoachCatalog();
    }
    const existing = getCoachCatalog();
    const map = new Map<string, MicroCourse>();
    existing.forEach(c => map.set(c.id, c));
    incoming.forEach(c => map.set(c.id, c));
    const merged = Array.from(map.values());
    saveCoachCatalog(merged);
    return getCoachCatalog();
  } catch {
    return getCoachCatalog();
  }
}

export function normalizeToYouTubeEmbed(url: string): string {
  try {
    const u = new URL(url);
    // Handle watch URLs and short youtu.be URLs
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '');
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes('youtube.com')) {
      // Playlist support: if the URL has a list parameter and no specific video id,
      // render the playlist embed.
      const listId = u.searchParams.get('list');
      const id = u.searchParams.get('v');
      if (id) {
        // When both v and list are present, preserve the playlist context.
        if (listId) return `https://www.youtube.com/embed/${id}?list=${listId}`;
        return `https://www.youtube.com/embed/${id}`;
      }
      if (listId) return `https://www.youtube.com/embed/videoseries?list=${listId}`;
      // Already an embed?
      if (u.pathname.includes('/embed/')) return url;
    }
    // Vimeo support: convert vimeo.com/<id> to player.vimeo.com/video/<id>
    if (u.hostname.includes('vimeo.com')) {
      const parts = u.pathname.split('/').filter(Boolean);
      const id = parts.reverse().find(p => /^(\d+)$/.test(p));
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    // Fallback for unknown providers: return original URL
    return url;
  } catch (e) {
    return url;
  }
}

export function markCourseCompleted(id: string) {
  const key = 'micro_courses_completed';
  const raw = localStorage.getItem(key);
  const arr = raw ? JSON.parse(raw) : [];
  const now = new Date().toISOString();
  arr.push({ id, completedAt: now });
  localStorage.setItem(key, JSON.stringify(arr));
}