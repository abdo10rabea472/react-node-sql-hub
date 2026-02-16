
-- Fix RLS policies for ai_analysis_results
DROP POLICY IF EXISTS "Allow all on ai_analysis_results" ON public.ai_analysis_results;

CREATE POLICY "Authenticated users can access ai_analysis_results"
ON public.ai_analysis_results
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Fix RLS policies for ai_decision_log
DROP POLICY IF EXISTS "Allow all on ai_decision_log" ON public.ai_decision_log;

CREATE POLICY "Authenticated users can access ai_decision_log"
ON public.ai_decision_log
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
