export type CBTItemType =
  | 'mcq'
  | 'multiple_answer'
  | 'true_false'
  | 'short_answer'
  | 'essay'
  | 'code'
  | 'numeric'
  | 'matrix';

export interface CBTItemOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface CBTRubricCriterion {
  id: string;
  label: string;
  maxScore: number;
}

export interface CBTItem {
  id: string;
  tenant_id?: string;
  type: CBTItemType;
  stem: string;
  options?: CBTItemOption[];
  answerKey?: string | string[] | number | Record<string, string | number>;
  rubric?: CBTRubricCriterion[];
  difficulty?: number;
  tags?: string[];
  learningObjectives?: string[];
  mediaUrls?: string[];
  created_at?: string;
  updated_at?: string;
  author_id?: string;
  version?: number;
  status?: 'draft' | 'approved' | 'archived';
}

export interface CBTExamSectionBlueprint {
  id: string;
  title: string;
  targetCount?: number;
  tags?: string[];
  difficultyRange?: [number, number];
}

export interface CBTExamSection {
  id: string;
  title: string;
  itemIds?: string[];
  blueprint?: CBTExamSectionBlueprint;
  timeLimitMinutes?: number;
}

export interface CBTExamRules {
  shuffleItems?: boolean;
  shuffleOptions?: boolean;
  calculatorAllowed?: boolean;
  navigation?: 'linear' | 'free';
  attempts?: number;
  accommodations?: Record<string, boolean | number | string>;
  autoGradeOnSubmit?: boolean;
  autoEnterScores?: boolean;
  scoreEntry?: {
    subjectId?: string;
    className?: string;
    term?: string;
    examWeight?: number;
  };
}

export interface CBTExam {
  id: string;
  tenant_id?: string;
  title: string;
  description?: string;
  sections: CBTExamSection[];
  rules?: CBTExamRules;
  timeWindowStart?: string;
  timeWindowEnd?: string;
  status?: 'draft' | 'ready' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export interface CBTSession {
  id: string;
  exam_id: string;
  user_id: string;
  tenant_id?: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  started_at?: string;
  submitted_at?: string;
  risk_score?: number;
}

export interface CBTResponse {
  id: string;
  session_id: string;
  item_id: string;
  answer: any;
  autoScore?: number;
  aiScore?: number;
  rationale?: string;
  timeOnItemSeconds?: number;
}

export interface CBTGrade {
  id: string;
  session_id: string;
  totalScore: number;
  subScores?: Record<string, number>;
  masteryLevels?: Record<string, string>;
}
