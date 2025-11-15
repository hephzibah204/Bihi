CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.cbt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text,
  type text CHECK (type IN ('mcq','multiple_answer','true_false','short_answer','essay','code','numeric','matrix')) NOT NULL,
  stem text NOT NULL,
  options jsonb DEFAULT '[]'::jsonb,
  answer_key jsonb,
  rubric jsonb DEFAULT '[]'::jsonb,
  difficulty int,
  tags text[] DEFAULT '{}',
  learning_objectives text[] DEFAULT '{}',
  media_urls text[] DEFAULT '{}',
  status text CHECK (status IN ('draft','approved','archived')) DEFAULT 'draft',
  author_id text,
  version int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cbt_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text,
  title text NOT NULL,
  description text,
  sections jsonb DEFAULT '[]'::jsonb,
  rules jsonb DEFAULT '{}'::jsonb,
  time_window_start timestamptz,
  time_window_end timestamptz,
  status text CHECK (status IN ('draft','ready','archived')) DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cbt_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id text,
  status text CHECK (status IN ('not_started','in_progress','submitted','graded')) DEFAULT 'not_started',
  started_at timestamptz,
  submitted_at timestamptz,
  risk_score int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cbt_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.cbt_sessions(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.cbt_items(id) ON DELETE CASCADE,
  answer jsonb,
  auto_score numeric,
  ai_score numeric,
  rationale text,
  time_on_item_seconds int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cbt_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid UNIQUE REFERENCES public.cbt_sessions(id) ON DELETE CASCADE,
  total_score numeric NOT NULL,
  sub_scores jsonb DEFAULT '{}'::jsonb,
  mastery_levels jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cbt_proctor_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.cbt_sessions(id) ON DELETE CASCADE,
  event_type text CHECK (event_type IN ('focus_loss','tab_switch','screen_change','clipboard','camera_blocked','mic_blocked','webcam_snapshot','flagged_behavior','network_loss','restore')),
  payload jsonb DEFAULT '{}'::jsonb,
  risk_increment int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cbt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_proctor_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_cbt_items_tenant ON public.cbt_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cbt_items_difficulty ON public.cbt_items(difficulty);
CREATE INDEX IF NOT EXISTS idx_cbt_items_status ON public.cbt_items(status);
CREATE INDEX IF NOT EXISTS idx_cbt_items_tags ON public.cbt_items USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_cbt_items_lo ON public.cbt_items USING GIN (learning_objectives);

CREATE INDEX IF NOT EXISTS idx_cbt_exams_tenant ON public.cbt_exams(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cbt_exams_status ON public.cbt_exams(status);
CREATE INDEX IF NOT EXISTS idx_cbt_exams_created_at ON public.cbt_exams(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cbt_sessions_exam ON public.cbt_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_cbt_sessions_user ON public.cbt_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cbt_sessions_status ON public.cbt_sessions(status);

CREATE INDEX IF NOT EXISTS idx_cbt_responses_session_item ON public.cbt_responses(session_id, item_id);
CREATE INDEX IF NOT EXISTS idx_cbt_responses_session ON public.cbt_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_cbt_responses_item ON public.cbt_responses(item_id);

CREATE INDEX IF NOT EXISTS idx_cbt_grades_session ON public.cbt_grades(session_id);

CREATE INDEX IF NOT EXISTS idx_cbt_proctor_session ON public.cbt_proctor_events(session_id);
CREATE INDEX IF NOT EXISTS idx_cbt_proctor_event_type ON public.cbt_proctor_events(event_type);
CREATE INDEX IF NOT EXISTS idx_cbt_proctor_created_at ON public.cbt_proctor_events(created_at DESC);

