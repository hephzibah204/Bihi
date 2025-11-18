-- Fixes for schema alignment with application code

-- profiles: add full_name if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text;

-- files: add linked_type if missing
ALTER TABLE files ADD COLUMN IF NOT EXISTS linked_type text;

-- attendance: add id column if missing
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

-- ai_coach_watch_time: add id and a uniqueness for upserts
ALTER TABLE ai_coach_watch_time ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'uq_ai_watch_time_tenant_teacher_course'
  ) THEN
    CREATE UNIQUE INDEX uq_ai_watch_time_tenant_teacher_course ON ai_coach_watch_time(tenant_id, teacher_id, course_id);
  END IF;
END $$;

-- admissions: create table with camelCase columns to match code
CREATE TABLE IF NOT EXISTS admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "candidateName" text NOT NULL,
  "intendedClass" text NOT NULL,
  "parentName" text,
  "parentEmail" text,
  "parentPhone" text,
  stage text NOT NULL,
  "leadSource" text,
  campaign text,
  "applicationFeeInvoiceId" text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- teacher_ratings: minimal table for announcer hook
CREATE TABLE IF NOT EXISTS teacher_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  score numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_teacher ON teacher_ratings(teacher_id);

-- user_tenants: used for RLS validation
CREATE TABLE IF NOT EXISTS user_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_tenants_user ON user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant ON user_tenants(tenant_id);

