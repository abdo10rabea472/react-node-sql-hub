
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can access ai_analysis_results" ON public.ai_analysis_results;
DROP POLICY IF EXISTS "Authenticated users can access ai_decision_log" ON public.ai_decision_log;

-- Create restrictive policies: only service role can access these tables
-- Since the app uses PHP auth, these tables are only accessed from edge functions
CREATE POLICY "Service role only for ai_analysis_results"
ON public.ai_analysis_results
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role only for ai_decision_log"
ON public.ai_decision_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
