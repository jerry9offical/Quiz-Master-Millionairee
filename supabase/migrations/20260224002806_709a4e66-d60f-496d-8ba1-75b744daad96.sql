
CREATE OR REPLACE FUNCTION public.get_player_retention_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  WITH
  total_users AS (
    SELECT count(*) AS cnt FROM profiles
  ),
  players AS (
    SELECT DISTINCT user_id FROM quiz_runs
  ),
  active_today AS (
    SELECT count(DISTINCT user_id) AS cnt FROM quiz_runs
    WHERE started_at::date = CURRENT_DATE
  ),
  active_7d AS (
    SELECT count(DISTINCT user_id) AS cnt FROM quiz_runs
    WHERE started_at >= now() - interval '7 days'
  ),
  active_30d AS (
    SELECT count(DISTINCT user_id) AS cnt FROM quiz_runs
    WHERE started_at >= now() - interval '30 days'
  ),
  repeat_players AS (
    SELECT count(*) AS cnt FROM (
      SELECT user_id FROM quiz_runs
      GROUP BY user_id
      HAVING count(DISTINCT started_at::date) >= 2
    ) sub
  ),
  new_today AS (
    SELECT count(*) AS cnt FROM (
      SELECT user_id, min(started_at::date) AS first_play
      FROM quiz_runs GROUP BY user_id
    ) sub WHERE first_play = CURRENT_DATE
  ),
  daily_activity AS (
    SELECT json_agg(row_to_json(d) ORDER BY d.day) AS data FROM (
      SELECT
        gs::date AS day,
        coalesce(count(DISTINCT qr.user_id), 0) AS players,
        coalesce(count(qr.id), 0) AS games
      FROM generate_series(CURRENT_DATE - interval '13 days', CURRENT_DATE, '1 day') gs
      LEFT JOIN quiz_runs qr ON qr.started_at::date = gs::date
      GROUP BY gs::date
    ) d
  ),
  top_returners AS (
    SELECT json_agg(row_to_json(t) ORDER BY t.days_active DESC, t.total_games DESC) AS data FROM (
      SELECT
        p.name,
        p.country_code,
        count(DISTINCT qr.started_at::date) AS days_active,
        count(qr.id) AS total_games,
        max(qr.money_won) AS best_score,
        max(qr.started_at) AS last_played
      FROM quiz_runs qr
      JOIN profiles p ON p.user_id = qr.user_id
      GROUP BY qr.user_id, p.name, p.country_code
      HAVING count(DISTINCT qr.started_at::date) >= 2
      ORDER BY count(DISTINCT qr.started_at::date) DESC, count(qr.id) DESC
      LIMIT 20
    ) t
  )
  SELECT jsonb_build_object(
    'total_users', (SELECT cnt FROM total_users),
    'total_players', (SELECT count(*) FROM players),
    'active_today', (SELECT cnt FROM active_today),
    'active_7d', (SELECT cnt FROM active_7d),
    'active_30d', (SELECT cnt FROM active_30d),
    'returning_players', (SELECT cnt FROM repeat_players),
    'new_today', (SELECT cnt FROM new_today),
    'daily_activity', (SELECT data FROM daily_activity),
    'top_returners', (SELECT data FROM top_returners)
  ) INTO result;

  RETURN result;
END;
$$;
