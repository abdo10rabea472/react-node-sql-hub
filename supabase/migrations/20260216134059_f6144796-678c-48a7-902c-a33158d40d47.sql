
-- Table to persist AI analysis results
CREATE TABLE public.ai_analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_type TEXT NOT NULL, -- 'full-analysis', 'decisions', 'monitoring'
  result_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (analysis_type)
);

-- Table to persist AI decision log
CREATE TABLE public.ai_decision_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  action TEXT,
  severity TEXT DEFAULT 'info',
  target_name TEXT,
  target_type TEXT,
  reasoning TEXT,
  executed_by TEXT DEFAULT 'AI',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- No RLS - this is an internal admin tool, not user-facing
ALTER TABLE public.ai_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decision_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations (admin-only system, no auth users)
CREATE POLICY "Allow all on ai_analysis_results" ON public.ai_analysis_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ai_decision_log" ON public.ai_decision_log FOR ALL USING (true) WITH CHECK (true);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_ai_analysis_results_updated_at
  BEFORE UPDATE ON public.ai_analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
