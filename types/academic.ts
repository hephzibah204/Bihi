// Academic and Curriculum Types

export interface Subject {
  id: string;
  name: string;
  classes: string[];
}

export interface Score {
  studentId: string;
  subjectId: string;
  session: string;
  term: string;
  ca1?: number;
  ca2?: number;
  exam?: number;
  comment?: string;
}

export interface Remark {
  studentId: string;
  session: string;
  term: string;
  generalComment?: string;
  affectiveRatings?: Record<string, number>;
  psychomotorRatings?: Record<string, number>;
}

export interface BehavioralLogEntry {
  id: string;
  studentId: string;
  date: string;
  remark: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface AttendanceRecord {
  date: string;
  class: string;
  statuses: Record<string, 'present' | 'absent' | 'late'>;
}

export interface Assignment {
  id: string;
  class: string;
  title: string;
  description: string;
  subjectId: string;
  dueDate: string;
  maxScore: number;
  type?: string;
  // Continuous Assessment configuration
  // When true, this assignment contributes to Continuous Assessment (CA)
  includeInCA?: boolean;
  // Percentage weight from 0-100 indicating how much this assignment counts towards CA
  // Interpretation of this weight depends on the grading policy; kept optional for backward compatibility
  caWeight?: number;
}

export interface AssignmentScore {
  id: string;
  assignmentId: string;
  studentId: string;
  score: number;
  comment?: string;
}

export interface SharedLessonPlan {
  id: string;
  topic: string;
  subjectId: string;
  class: string;
  content: string;
  sharedByTeacherId: string;
  sharedByTeacherName: string;
  createdAt: string;
  upvotes: number;
}

export interface AbsenceReport {
  id: string;
  studentId: string;
  reportedByParentId: string;
  date: string;
  reason: 'Sickness' | 'Family Emergency' | 'Other';
  details?: string;
  status: 'Pending' | 'Acknowledged';
}

// 21st-Century Classroom Templates
export interface LessonTemplate {
  id: string;
  title: string;
  description: string;
  pillars: {
    collaboration: boolean;
    creativity: boolean;
    technology: boolean;
  };
  steps: Array<{
    id: string;
    title: string;
    guidance: string;
    requiredPillars?: Array<'collaboration' | 'creativity' | 'technology'>;
  }>;
  suggestedDurationMinutes?: number;
  subjects?: string[];
  gradeLevels?: string[];
}

export interface LessonPlan {
  id: string;
  templateId: string;
  title: string;
  subjectId?: string;
  gradeLevel?: string;
  objectives: string[];
  steps: Array<{
    id: string;
    notes?: string;
    completed?: boolean;
  }>;
  resources?: string[];
  assessments?: string[];
  createdByTeacherId: string;
  createdAt: string;
  updatedAt?: string;
}