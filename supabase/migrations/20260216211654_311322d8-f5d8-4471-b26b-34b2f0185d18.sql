
-- Deny all public access to ai_analysis_results (service role only)
CREATE POLICY "Deny all access to ai_analysis_results"
ON public.ai_analysis_results
FOR ALL
USING (false)
WITH CHECK (false);

-- Deny all public access to ai_rate_limits (service role only)
CREATE POLICY "Deny all access to ai_rate_limits"
ON public.ai_rate_limits
FOR ALL
USING (false)
WITH CHECK (false);

-- Deny all public access to ai_decision_log (service role only)
CREATE POLICY "Deny all access to ai_decision_log"
ON public.ai_decision_log
FOR ALL
USING (false)
WITH CHECK (false);
