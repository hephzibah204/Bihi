-- RLS policies for CBT tables scoped by tenant and user roles

-- Helper expressions
-- Note: Supabase exposes JWT via auth.jwt() with custom claims
-- We assume a claim 'tenant_id' is present in user_metadata

DO $$ BEGIN
  -- cbt_items
  CREATE POLICY cbt_items_tenant_read ON public.cbt_items
    FOR SELECT USING ((auth.jwt() ->> 'tenant_id') IS NULL OR tenant_id = auth.jwt() ->> 'tenant_id');
  CREATE POLICY cbt_items_tenant_write ON public.cbt_items
    FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');
  CREATE POLICY cbt_items_tenant_update ON public.cbt_items
    FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id') WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- cbt_exams
  CREATE POLICY cbt_exams_tenant_read ON public.cbt_exams
    FOR SELECT USING ((auth.jwt() ->> 'tenant_id') IS NULL OR tenant_id = auth.jwt() ->> 'tenant_id');
  CREATE POLICY cbt_exams_tenant_write ON public.cbt_exams
    FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');
  CREATE POLICY cbt_exams_tenant_update ON public.cbt_exams
    FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id') WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- cbt_sessions
  CREATE POLICY cbt_sessions_read_own ON public.cbt_sessions
    FOR SELECT USING (user_id = auth.uid());
  CREATE POLICY cbt_sessions_read_tenant ON public.cbt_sessions
    FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');
  CREATE POLICY cbt_sessions_insert_own ON public.cbt_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid() AND tenant_id = auth.jwt() ->> 'tenant_id');
  CREATE POLICY cbt_sessions_update_own ON public.cbt_sessions
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  CREATE POLICY cbt_sessions_update_tenant ON public.cbt_sessions
    FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id') WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- cbt_responses
  CREATE POLICY cbt_responses_read_tenant ON public.cbt_responses
    FOR SELECT USING (EXISTS (
      SELECT 1 FROM public.cbt_sessions s WHERE s.id = cbt_responses.session_id AND s.tenant_id = auth.jwt() ->> 'tenant_id'
    ) OR EXISTS (
      SELECT 1 FROM public.cbt_sessions s WHERE s.id = cbt_responses.session_id AND s.user_id = auth.uid()
    ));
  CREATE POLICY cbt_responses_insert_own ON public.cbt_responses
    FOR INSERT WITH CHECK (EXISTS (
      SELECT 1 FROM public.cbt_sessions s WHERE s.id = cbt_responses.session_id AND s.user_id = auth.uid()
    ));
  CREATE POLICY cbt_responses_update_tenant ON public.cbt_responses
    FOR UPDATE USING (EXISTS (
      SELECT 1 FROM public.cbt_sessions s WHERE s.id = cbt_responses.session_id AND s.tenant_id = auth.jwt() ->> 'tenant_id'
    )) WITH CHECK (EXISTS (
      SELECT 1 FROM public.cbt_sessions s WHERE s.id = cbt_responses.session_id AND s.tenant_id = auth.jwt() ->> 'tenant_id'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- cbt_grades
  CREATE POLICY cbt_grades_read_tenant ON public.cbt_grades
    FOR SELECT USING (EXISTS (
      SELECT 1 FROM public.cbt_sessions s WHERE s.id = cbt_grades.session_id AND s.tenant_id = auth.jwt() ->> 'tenant_id'
    ) OR EXISTS (
      SELECT 1 FROM public.cbt_sessions s WHERE s.id = cbt_grades.session_id AND s.user_id = auth.uid()
    ));
  CREATE POLICY cbt_grades_insert_tenant ON public.cbt_grades
    FOR INSERT WITH CHECK (EXISTS (
      SELECT 1 FROM public.cbt_sessions s WHERE s.id = cbt_grades.session_id AND s.tenant_id = auth.jwt() ->> 'tenant_id'
    ));
  CREATE POLICY cbt_grades_update_tenant ON public.cbt_grades
    FOR UPDATE USING (EXISTS (
      SELECT 1 FROM public.cbt_sessions s WHERE s.id = cbt_grades.session_id AND s.tenant_id = auth.jwt() ->> 'tenant_id'
    )) WITH CHECK (EXISTS (
      SELECT 1 FROM public.cbt_sessions s WHERE s.id = cbt_grades.session_id AND s.tenant_id = auth.jwt() ->> 'tenant_id'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- cbt_proctor_events
  CREATE POLICY cbt_proctor_read_tenant ON public.cbt_proctor_events
    FOR SELECT USING (EXISTS (
      SELECT 1 FROM public.cbt_sessions s WHERE s.id = cbt_proctor_events.session_id AND s.tenant_id = auth.jwt() ->> 'tenant_id'
    ));
  CREATE POLICY cbt_proctor_insert_own ON public.cbt_proctor_events
    FOR INSERT WITH CHECK (EXISTS (
      SELECT 1 FROM public.cbt_sessions s WHERE s.id = cbt_proctor_events.session_id AND s.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

