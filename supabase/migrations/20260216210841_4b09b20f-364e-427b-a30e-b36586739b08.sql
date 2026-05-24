
-- Drop and recreate all 3 HOF views with the fix: exclude entries where money_won = 0

-- 1) monthly_hof_view: top 3 monthly earners (standard/premium only, no zero scores)
CREATE OR REPLACE VIEW public.monthly_hof_view WITH (security_invoker = false) AS
SELECT
  le.user_id,
  p.name AS display_name,
  p.country_code,
  p.country_name,
  MAX(le.best_money_won) AS money_won,
  RANK() OVER (ORDER BY MAX(le.best_money_won) DESC) AS rank
FROM leaderboard_entries le
JOIN profiles p ON p.user_id = le.user_id
WHERE le.period = 'monthly'
  AND le.category IS NULL
  AND le.best_money_won > 0
  AND p.access_tier IN ('standard', 'premium')
GROUP BY le.user_id, p.name, p.country_code, p.country_name
ORDER BY MAX(le.best_money_won) DESC
LIMIT 3;

-- 2) all_time_hof_view: top 10 all-time earners (standard/premium only, no zero scores)
CREATE OR REPLACE VIEW public.all_time_hof_view WITH (security_invoker = false) AS
SELECT
  le.user_id,
  p.name AS display_name,
  p.country_code,
  p.country_name,
  MAX(le.best_money_won) AS money_won,
  RANK() OVER (ORDER BY MAX(le.best_money_won) DESC) AS rank
FROM leaderboard_entries le
JOIN profiles p ON p.user_id = le.user_id
WHERE le.period = 'all_time'
  AND le.category IS NULL
  AND le.best_money_won > 0
  AND p.access_tier IN ('standard', 'premium')
GROUP BY le.user_id, p.name, p.country_code, p.country_name
ORDER BY MAX(le.best_money_won) DESC
LIMIT 10;

-- 3) masters_hof_view: top 10 per category (standard/premium only, no zero scores)
CREATE OR REPLACE VIEW public.masters_hof_view WITH (security_invoker = false) AS
WITH ranked AS (
  SELECT
    le.user_id,
    le.category,
    p.name AS display_name,
    p.country_code,
    p.country_name,
    MAX(le.best_money_won) AS money_won,
    ROW_NUMBER() OVER (PARTITION BY le.category ORDER BY MAX(le.best_money_won) DESC) AS rank
  FROM leaderboard_entries le
  JOIN profiles p ON p.user_id = le.user_id
  WHERE le.period = 'all_time'
    AND le.category IS NOT NULL
    AND le.best_money_won > 0
    AND p.access_tier IN ('standard', 'premium')
  GROUP BY le.user_id, le.category, p.name, p.country_code, p.country_name
)
SELECT user_id, category, display_name, country_code, country_name, money_won, rank
FROM ranked
WHERE rank <= 10
ORDER BY category, rank;
