
-- Add country fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country_code text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS country_name text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS country_detected_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS country_source text DEFAULT NULL;

-- Recreate leaderboard_profiles view to include country_code
CREATE OR REPLACE VIEW public.leaderboard_profiles
WITH (security_invoker = false)
AS
SELECT
  p.user_id,
  p.name,
  p.avatar_url,
  p.country_code
FROM public.profiles p;

-- Grant access
GRANT SELECT ON public.leaderboard_profiles TO anon, authenticated;
