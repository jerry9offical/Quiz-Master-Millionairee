-- Drop the overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Public profiles for leaderboard" ON public.profiles;

-- Create a secure view for leaderboard that only exposes non-sensitive data
CREATE OR REPLACE VIEW public.leaderboard_profiles AS
SELECT user_id, name, avatar_url
FROM public.profiles;

-- Grant access to the view for all users (anon and authenticated)
GRANT SELECT ON public.leaderboard_profiles TO anon, authenticated;