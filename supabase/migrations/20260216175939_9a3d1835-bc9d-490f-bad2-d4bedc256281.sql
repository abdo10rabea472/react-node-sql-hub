
-- Allow anon key to read/write these cache tables
-- These are application-level AI cache, not user-sensitive data
CREATE POLICY "Anon can read ai_analysis_results"
ON public.ai_analysis_results
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon can upsert ai_analysis_results"
ON public.ai_analysis_results
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anon can update ai_analysis_results"
ON public.ai_analysis_results
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can read ai_decision_log"
ON public.ai_decision_log
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon can insert ai_decision_log"
ON public.ai_decision_log
FOR INSERT
TO anon
WITH CHECK (true);
