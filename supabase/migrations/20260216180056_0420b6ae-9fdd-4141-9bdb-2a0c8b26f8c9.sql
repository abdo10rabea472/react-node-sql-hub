
-- Remove all anon policies that expose data publicly
DROP POLICY IF EXISTS "Anon can read ai_analysis_results" ON public.ai_analysis_results;
DROP POLICY IF EXISTS "Anon can upsert ai_analysis_results" ON public.ai_analysis_results;
DROP POLICY IF EXISTS "Anon can update ai_analysis_results" ON public.ai_analysis_results;
DROP POLICY IF EXISTS "Anon can read ai_decision_log" ON public.ai_decision_log;
DROP POLICY IF EXISTS "Anon can insert ai_decision_log" ON public.ai_decision_log;

-- Keep only service_role policies (already created previously)
-- service_role bypasses RLS anyway, so these are just explicit documentation
