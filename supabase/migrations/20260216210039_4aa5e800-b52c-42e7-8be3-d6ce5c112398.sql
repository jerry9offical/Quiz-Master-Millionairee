
-- The views need SECURITY DEFINER to bypass profiles RLS (same pattern as leaderboard_profiles).
-- This is intentional: they only expose display_name, country_code, country_name — no sensitive data.
-- Recreate with explicit security_invoker = false (security definer)
DROP VIEW IF EXISTS public.monthly_hof_view;
DROP VIEW IF EXISTS public.all_time_hof_view;
DROP VIEW IF EXISTS public.masters_hof_view;

CREATE VIEW public.monthly_hof_view
WITH (security_invoker = false)
AS
SELECT
  le.user_id,
  p.name AS display_name,
  p.country_code,
  p.country_name,
  MAX(le.best_money_won) AS money_won,
  RANK() OVER (ORDER BY MAX(le.best_money_won) DESC) AS rank
FROM public.leaderboard_entries le
JOIN public.profiles p ON p.user_id = le.user_id
WHERE le.period = 'monthly'
  AND le.category IS NULL
  AND p.access_tier IN ('standard', 'premium')
GROUP BY le.user_id, p.name, p.country_code, p.country_name
ORDER BY money_won DESC
LIMIT 3;

CREATE VIEW public.all_time_hof_view
WITH (security_invoker = false)
AS
SELECT
  le.user_id,
  p.name AS display_name,
  p.country_code,
  p.country_name,
  MAX(le.best_money_won) AS money_won,
  RANK() OVER (ORDER BY MAX(le.best_money_won) DESC) AS rank
FROM public.leaderboard_entries le
JOIN public.profiles p ON p.user_id = le.user_id
WHERE le.period = 'all_time'
  AND le.category IS NULL
  AND p.access_tier IN ('standard', 'premium')
GROUP BY le.user_id, p.name, p.country_code, p.country_name
ORDER BY money_won DESC
LIMIT 10;

CREATE VIEW public.masters_hof_view
WITH (security_invoker = false)
AS
WITH ranked AS (
  SELECT
    le.user_id,
    le.category,
    p.name AS display_name,
    p.country_code,
    p.country_name,
    MAX(le.best_money_won) AS money_won,
    ROW_NUMBER() OVER (PARTITION BY le.category ORDER BY MAX(le.best_money_won) DESC) AS rank
  FROM public.leaderboard_entries le
  JOIN public.profiles p ON p.user_id = le.user_id
  WHERE le.period = 'all_time'
    AND le.category IS NOT NULL
    AND p.access_tier IN ('standard', 'premium')
  GROUP BY le.user_id, le.category, p.name, p.country_code, p.country_name
)
SELECT user_id, category, display_name, country_code, country_name, money_won, rank
FROM ranked
WHERE rank <= 10
ORDER BY category, rank;

GRANT SELECT ON public.monthly_hof_view TO anon, authenticated;
GRANT SELECT ON public.all_time_hof_view TO anon, authenticated;
GRANT SELECT ON public.masters_hof_view TO anon, authenticated;
