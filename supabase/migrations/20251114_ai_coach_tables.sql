-- AI Coach Progress & Certification Tables
-- Created: 2025-11-14

-- Course completions per teacher
CREATE TABLE IF NOT EXISTS ai_coach_course_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT,
  teacher_id TEXT,
  teacher_name TEXT,
  course_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_coach_completions_tenant ON ai_coach_course_completions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_completions_teacher ON ai_coach_course_completions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_completions_course ON ai_coach_course_completions(course_id);

-- Quiz attempts per course per teacher
CREATE TABLE IF NOT EXISTS ai_coach_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT,
  teacher_id TEXT,
  teacher_name TEXT,
  course_id TEXT NOT NULL,
  at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total INTEGER NOT NULL,
  score INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_coach_quiz_tenant ON ai_coach_quiz_attempts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_quiz_teacher ON ai_coach_quiz_attempts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_quiz_course ON ai_coach_quiz_attempts(course_id);

-- Watch time per course per teacher (aggregated)
CREATE TABLE IF NOT EXISTS ai_coach_watch_time (
  tenant_id TEXT,
  teacher_id TEXT,
  course_id TEXT,
  total_seconds BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (tenant_id, teacher_id, course_id)
);

-- Certificates
CREATE TABLE IF NOT EXISTS ai_coach_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_code TEXT,
  tenant_id TEXT,
  teacher_id TEXT,
  teacher_name TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_course_ids JSONB DEFAULT '[]'::jsonb,
  avg_score_pct INTEGER,
  min_courses INTEGER,
  min_score_pct INTEGER
);

CREATE INDEX IF NOT EXISTS idx_ai_coach_cert_tenant ON ai_coach_certificates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_cert_teacher ON ai_coach_certificates(teacher_id);

-- Enable RLS, allow reads and writes for now (adjust later for stricter policies)
ALTER TABLE ai_coach_course_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_watch_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_coach_completions_read ON ai_coach_course_completions FOR SELECT USING (true);
CREATE POLICY ai_coach_completions_write ON ai_coach_course_completions FOR INSERT WITH CHECK (true);
CREATE POLICY ai_coach_quiz_read ON ai_coach_quiz_attempts FOR SELECT USING (true);
CREATE POLICY ai_coach_quiz_write ON ai_coach_quiz_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY ai_coach_watch_read ON ai_coach_watch_time FOR SELECT USING (true);
CREATE POLICY ai_coach_watch_write ON ai_coach_watch_time FOR INSERT WITH CHECK (true);
CREATE POLICY ai_coach_watch_update ON ai_coach_watch_time FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY ai_coach_cert_read ON ai_coach_certificates FOR SELECT USING (true);
CREATE POLICY ai_coach_cert_write ON ai_coach_certificates FOR INSERT WITH CHECK (true);

