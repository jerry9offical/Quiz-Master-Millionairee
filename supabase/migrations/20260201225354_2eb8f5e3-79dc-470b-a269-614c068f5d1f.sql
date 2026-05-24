-- Recreate the view with SECURITY INVOKER (the safer default)
DROP VIEW IF EXISTS public.leaderboard_profiles;

CREATE VIEW public.leaderboard_profiles 
WITH (security_invoker = on)
AS
SELECT user_id, name, avatar_url
FROM public.profiles;

-- Grant access to the view for all users
GRANT SELECT ON public.leaderboard_profiles TO anon, authenticated;