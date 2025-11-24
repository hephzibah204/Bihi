-- CBT Core Tables Migration
-- Creates comprehensive tables for Computer-Based Testing system

-- Create cbt_items table
CREATE TABLE IF NOT EXISTS public.cbt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    type TEXT CHECK (type IN ('mcq','multiple_answer','true_false','short_answer','essay','code','numeric','matrix')),
    stem TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    answer_key JSONB,
    rubric JSONB DEFAULT '[]'::jsonb,
    difficulty INT CHECK (difficulty >= 1 AND difficulty <= 10),
    tags TEXT[] DEFAULT '{}',
    learning_objectives TEXT[] DEFAULT '{}',
    media_urls TEXT[] DEFAULT '{}',
    status TEXT CHECK (status IN ('draft','approved','archived')) DEFAULT 'draft',
    author_id TEXT,
    version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cbt_exams table
CREATE TABLE IF NOT EXISTS public.cbt_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sections JSONB DEFAULT '[]'::jsonb,
    rules JSONB DEFAULT '{}'::jsonb,
    time_window_start TIMESTAMPTZ,
    time_window_end TIMESTAMPTZ,
    subject TEXT,
    class TEXT,
    session TEXT,
    term TEXT,
    status TEXT CHECK (status IN ('draft','ready','archived')) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cbt_sessions table
CREATE TABLE IF NOT EXISTS public.cbt_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL,
    status TEXT CHECK (status IN ('not_started','in_progress','submitted','graded')) DEFAULT 'not_started',
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    risk_score INT DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    environment JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cbt_responses table
CREATE TABLE IF NOT EXISTS public.cbt_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.cbt_sessions(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.cbt_items(id) ON DELETE CASCADE,
    answer JSONB,
    auto_score NUMERIC(5,2),
    ai_score NUMERIC(5,2),
    rationale TEXT,
    time_on_item_seconds INT DEFAULT 0,
    provider TEXT,
    confidence NUMERIC(3,2),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cbt_grades table
CREATE TABLE IF NOT EXISTS public.cbt_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.cbt_sessions(id) ON DELETE CASCADE UNIQUE,
    total_score NUMERIC(5,2) NOT NULL,
    sub_scores JSONB DEFAULT '{}'::jsonb,
    mastery_levels JSONB DEFAULT '{}'::jsonb,
    grade TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cbt_proctor_events table
CREATE TABLE IF NOT EXISTS public.cbt_proctor_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.cbt_sessions(id) ON DELETE CASCADE,
    event_type TEXT CHECK (event_type IN ('focus_loss','tab_switch','screen_change','clipboard','camera_blocked','mic_blocked','webcam_snapshot','flagged_behavior','network_loss','restore')),
    payload JSONB DEFAULT '{}'::jsonb,
    risk_increment INT DEFAULT 0 CHECK (risk_increment >= 0),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cbt_items_tenant ON public.cbt_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cbt_items_difficulty ON public.cbt_items(difficulty);
CREATE INDEX IF NOT EXISTS idx_cbt_items_status ON public.cbt_items(status);
CREATE INDEX IF NOT EXISTS idx_cbt_items_author ON public.cbt_items(author_id);
CREATE INDEX IF NOT EXISTS idx_cbt_items_tags ON public.cbt_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_cbt_items_learning_objectives ON public.cbt_items USING GIN(learning_objectives);

CREATE INDEX IF NOT EXISTS idx_cbt_exams_tenant ON public.cbt_exams(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cbt_exams_status ON public.cbt_exams(status);
CREATE INDEX IF NOT EXISTS idx_cbt_exams_created_at ON public.cbt_exams(created_at);
CREATE INDEX IF NOT EXISTS idx_cbt_exams_subject ON public.cbt_exams(subject);
CREATE INDEX IF NOT EXISTS idx_cbt_exams_class ON public.cbt_exams(class);

CREATE INDEX IF NOT EXISTS idx_cbt_sessions_exam ON public.cbt_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_cbt_sessions_user ON public.cbt_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cbt_sessions_tenant ON public.cbt_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cbt_sessions_status ON public.cbt_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cbt_sessions_created_at ON public.cbt_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_cbt_responses_session ON public.cbt_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_cbt_responses_item ON public.cbt_responses(item_id);
CREATE INDEX IF NOT EXISTS idx_cbt_responses_session_item ON public.cbt_responses(session_id, item_id);
CREATE INDEX IF NOT EXISTS idx_cbt_responses_created_at ON public.cbt_responses(created_at);

CREATE INDEX IF NOT EXISTS idx_cbt_grades_session ON public.cbt_grades(session_id);
CREATE INDEX IF NOT EXISTS idx_cbt_grades_total_score ON public.cbt_grades(total_score);

CREATE INDEX IF NOT EXISTS idx_cbt_proctor_session ON public.cbt_proctor_events(session_id);
CREATE INDEX IF NOT EXISTS idx_cbt_proctor_event_type ON public.cbt_proctor_events(event_type);
CREATE INDEX IF NOT EXISTS idx_cbt_proctor_timestamp ON public.cbt_proctor_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_cbt_proctor_created_at ON public.cbt_proctor_events(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cbt_items_updated_at 
    BEFORE UPDATE ON public.cbt_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cbt_exams_updated_at 
    BEFORE UPDATE ON public.cbt_exams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cbt_sessions_updated_at 
    BEFORE UPDATE ON public.cbt_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cbt_responses_updated_at 
    BEFORE UPDATE ON public.cbt_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cbt_grades_updated_at 
    BEFORE UPDATE ON public.cbt_grades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.cbt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_proctor_events ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- CBT Items policies
CREATE POLICY "Users can view approved items in their tenant" ON public.cbt_items
    FOR SELECT USING (
        tenant_id = current_setting('app.current_tenant', true)::text 
        AND status = 'approved'
    );

CREATE POLICY "Teachers can view all items in their tenant" ON public.cbt_items
    FOR SELECT USING (
        tenant_id = current_setting('app.current_tenant', true)::text
    );

CREATE POLICY "Teachers can insert items in their tenant" ON public.cbt_items
    FOR INSERT WITH CHECK (
        tenant_id = current_setting('app.current_tenant', true)::text
    );

CREATE POLICY "Teachers can update their own items" ON public.cbt_items
    FOR UPDATE USING (
        tenant_id = current_setting('app.current_tenant', true)::text
        AND (author_id = auth.uid()::text OR EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_metadata->>'role' IN ('Super Admin', 'School Admin')
        ))
    );

-- CBT Exams policies
CREATE POLICY "Users can view ready exams in their tenant" ON public.cbt_exams
    FOR SELECT USING (
        tenant_id = current_setting('app.current_tenant', true)::text
        AND status = 'ready'
    );

CREATE POLICY "Teachers can view all exams in their tenant" ON public.cbt_exams
    FOR SELECT USING (
        tenant_id = current_setting('app.current_tenant', true)::text
    );

CREATE POLICY "Teachers can insert exams in their tenant" ON public.cbt_exams
    FOR INSERT WITH CHECK (
        tenant_id = current_setting('app.current_tenant', true)::text
    );

CREATE POLICY "Teachers can update exams in their tenant" ON public.cbt_exams
    FOR UPDATE USING (
        tenant_id = current_setting('app.current_tenant', true)::text
    );

-- CBT Sessions policies
CREATE POLICY "Students can view their own sessions" ON public.cbt_sessions
    FOR SELECT USING (
        user_id = auth.uid()
    );

CREATE POLICY "Teachers can view sessions in their tenant" ON public.cbt_sessions
    FOR SELECT USING (
        tenant_id = current_setting('app.current_tenant', true)::text
    );

CREATE POLICY "Students can insert their own sessions" ON public.cbt_sessions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND tenant_id = current_setting('app.current_tenant', true)::text
    );

CREATE POLICY "Students can update their own sessions" ON public.cbt_sessions
    FOR UPDATE USING (
        user_id = auth.uid()
    );

-- CBT Responses policies
CREATE POLICY "Students can view their own responses" ON public.cbt_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cbt_sessions
            WHERE public.cbt_sessions.id = public.cbt_responses.session_id
            AND public.cbt_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can view responses in their tenant" ON public.cbt_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cbt_sessions
            WHERE public.cbt_sessions.id = public.cbt_responses.session_id
            AND public.cbt_sessions.tenant_id = current_setting('app.current_tenant', true)::text
        )
    );

CREATE POLICY "Students can insert their own responses" ON public.cbt_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cbt_sessions
            WHERE public.cbt_sessions.id = public.cbt_responses.session_id
            AND public.cbt_sessions.user_id = auth.uid()
        )
    );

-- CBT Grades policies
CREATE POLICY "Students can view their own grades" ON public.cbt_grades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cbt_sessions
            WHERE public.cbt_sessions.id = public.cbt_grades.session_id
            AND public.cbt_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can view grades in their tenant" ON public.cbt_grades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cbt_sessions
            WHERE public.cbt_sessions.id = public.cbt_grades.session_id
            AND public.cbt_sessions.tenant_id = current_setting('app.current_tenant', true)::text
        )
    );

CREATE POLICY "Teachers can insert grades in their tenant" ON public.cbt_grades
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cbt_sessions
            WHERE public.cbt_sessions.id = public.cbt_grades.session_id
            AND public.cbt_sessions.tenant_id = current_setting('app.current_tenant', true)::text
        )
    );

-- CBT Proctor Events policies
CREATE POLICY "Teachers can view proctor events in their tenant" ON public.cbt_proctor_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cbt_sessions
            WHERE public.cbt_sessions.id = public.cbt_proctor_events.session_id
            AND public.cbt_sessions.tenant_id = current_setting('app.current_tenant', true)::text
        )
    );

CREATE POLICY "Students can view their own proctor events" ON public.cbt_proctor_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cbt_sessions
            WHERE public.cbt_sessions.id = public.cbt_proctor_events.session_id
            AND public.cbt_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert proctor events" ON public.cbt_proctor_events
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.cbt_items TO anon, authenticated;
GRANT INSERT ON public.cbt_items TO authenticated;
GRANT UPDATE ON public.cbt_items TO authenticated;

GRANT SELECT ON public.cbt_exams TO anon, authenticated;
GRANT INSERT ON public.cbt_exams TO authenticated;
GRANT UPDATE ON public.cbt_exams TO authenticated;

GRANT SELECT ON public.cbt_sessions TO anon, authenticated;
GRANT INSERT ON public.cbt_sessions TO authenticated;
GRANT UPDATE ON public.cbt_sessions TO authenticated;

GRANT SELECT ON public.cbt_responses TO anon, authenticated;
GRANT INSERT ON public.cbt_responses TO authenticated;
GRANT UPDATE ON public.cbt_responses TO authenticated;

GRANT SELECT ON public.cbt_grades TO anon, authenticated;
GRANT INSERT ON public.cbt_grades TO authenticated;
GRANT UPDATE ON public.cbt_grades TO authenticated;

GRANT SELECT ON public.cbt_proctor_events TO anon, authenticated;
GRANT INSERT ON public.cbt_proctor_events TO authenticated;