
-- Rate limiting table for AI operations
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    token_hash text NOT NULL,
    request_count int NOT NULL DEFAULT 1,
    window_start timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS and restrict to service_role only
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_rate_limits FORCE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX idx_ai_rate_limits_token_window ON public.ai_rate_limits (token_hash, window_start);

-- Auto-cleanup old entries (older than 2 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.ai_rate_limits WHERE window_start < now() - interval '2 hours';
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_rate_limits
AFTER INSERT ON public.ai_rate_limits
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_rate_limits();
