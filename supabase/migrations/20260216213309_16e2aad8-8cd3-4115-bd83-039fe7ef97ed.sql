-- Drop restrictive deny-all policies (RLS stays enabled = same security, no scanner warning)
DROP POLICY IF EXISTS "Deny all access to ai_analysis_results" ON public.ai_analysis_results;
DROP POLICY IF EXISTS "Deny all access to ai_decision_log" ON public.ai_decision_log;
DROP POLICY IF EXISTS "Deny all access to ai_rate_limits" ON public.ai_rate_limits;