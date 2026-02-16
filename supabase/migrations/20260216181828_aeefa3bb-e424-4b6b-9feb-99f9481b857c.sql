
-- Remove all policies - service_role bypasses RLS automatically
DROP POLICY IF EXISTS "Service role only for ai_analysis_results" ON public.ai_analysis_results;
DROP POLICY IF EXISTS "Service role only for ai_decision_log" ON public.ai_decision_log;

-- Ensure RLS is enabled (blocks all non-service_role access when no policies exist)
ALTER TABLE public.ai_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decision_log ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner
ALTER TABLE public.ai_analysis_results FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decision_log FORCE ROW LEVEL SECURITY;
