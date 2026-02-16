
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Service role only for ai_analysis_results" ON public.ai_analysis_results;
DROP POLICY IF EXISTS "Service role only for ai_decision_log" ON public.ai_decision_log;

-- Create proper restrictive policies for ai_analysis_results
CREATE POLICY "Service role only for ai_analysis_results"
ON public.ai_analysis_results
FOR ALL
TO authenticated, anon
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create proper restrictive policies for ai_decision_log
CREATE POLICY "Service role only for ai_decision_log"
ON public.ai_decision_log
FOR ALL
TO authenticated, anon
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
