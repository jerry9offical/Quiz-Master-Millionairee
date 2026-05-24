
-- Clean up the failed expression index attempt
DROP INDEX IF EXISTS idx_leaderboard_unique;

-- Recreate functions using DELETE+INSERT (no unique index needed)
CREATE OR REPLACE FUNCTION public.refresh_leaderboards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM leaderboard_entries;
  
  INSERT INTO leaderboard_entries (user_id, period, category, best_money_won, last_updated)
  SELECT user_id, 'all_time'::leaderboard_period, NULL, MAX(money_won), now()
  FROM quiz_runs WHERE outcome IS NOT NULL GROUP BY user_id;

  INSERT INTO leaderboard_entries (user_id, period, category, best_money_won, last_updated)
  SELECT user_id, 'all_time'::leaderboard_period, chosen_category, MAX(money_won), now()
  FROM quiz_runs WHERE outcome IS NOT NULL AND chosen_category IS NOT NULL GROUP BY user_id, chosen_category;

  INSERT INTO leaderboard_entries (user_id, period, category, best_money_won, last_updated)
  SELECT user_id, 'monthly'::leaderboard_period, NULL, MAX(money_won), now()
  FROM quiz_runs WHERE outcome IS NOT NULL AND started_at >= date_trunc('month', now()) GROUP BY user_id;

  INSERT INTO leaderboard_entries (user_id, period, category, best_money_won, last_updated)
  SELECT user_id, 'monthly'::leaderboard_period, chosen_category, MAX(money_won), now()
  FROM quiz_runs WHERE outcome IS NOT NULL AND chosen_category IS NOT NULL AND started_at >= date_trunc('month', now()) GROUP BY user_id, chosen_category;

  INSERT INTO leaderboard_entries (user_id, period, category, best_money_won, last_updated)
  SELECT user_id, 'weekly'::leaderboard_period, NULL, MAX(money_won), now()
  FROM quiz_runs WHERE outcome IS NOT NULL AND started_at >= date_trunc('week', now()) GROUP BY user_id;

  INSERT INTO leaderboard_entries (user_id, period, category, best_money_won, last_updated)
  SELECT user_id, 'weekly'::leaderboard_period, chosen_category, MAX(money_won), now()
  FROM quiz_runs WHERE outcome IS NOT NULL AND chosen_category IS NOT NULL AND started_at >= date_trunc('week', now()) GROUP BY user_id, chosen_category;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_user_leaderboard(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM leaderboard_entries WHERE user_id = p_user_id;

  INSERT INTO leaderboard_entries (user_id, period, category, best_money_won, last_updated)
  SELECT p_user_id, 'all_time'::leaderboard_period, NULL, MAX(money_won), now()
  FROM quiz_runs WHERE user_id = p_user_id AND outcome IS NOT NULL HAVING MAX(money_won) IS NOT NULL;

  INSERT INTO leaderboard_entries (user_id, period, category, best_money_won, last_updated)
  SELECT p_user_id, 'all_time'::leaderboard_period, chosen_category, MAX(money_won), now()
  FROM quiz_runs WHERE user_id = p_user_id AND outcome IS NOT NULL AND chosen_category IS NOT NULL GROUP BY chosen_category;

  INSERT INTO leaderboard_entries (user_id, period, category, best_money_won, last_updated)
  SELECT p_user_id, 'monthly'::leaderboard_period, NULL, MAX(money_won), now()
  FROM quiz_runs WHERE user_id = p_user_id AND outcome IS NOT NULL AND started_at >= date_trunc('month', now()) HAVING MAX(money_won) IS NOT NULL;

  INSERT INTO leaderboard_entries (user_id, period, category, best_money_won, last_updated)
  SELECT p_user_id, 'monthly'::leaderboard_period, chosen_category, MAX(money_won), now()
  FROM quiz_runs WHERE user_id = p_user_id AND outcome IS NOT NULL AND chosen_category IS NOT NULL AND started_at >= date_trunc('month', now()) GROUP BY chosen_category;

  INSERT INTO leaderboard_entries (user_id, period, category, best_money_won, last_updated)
  SELECT p_user_id, 'weekly'::leaderboard_period, NULL, MAX(money_won), now()
  FROM quiz_runs WHERE user_id = p_user_id AND outcome IS NOT NULL AND started_at >= date_trunc('week', now()) HAVING MAX(money_won) IS NOT NULL;

  INSERT INTO leaderboard_entries (user_id, period, category, best_money_won, last_updated)
  SELECT p_user_id, 'weekly'::leaderboard_period, chosen_category, MAX(money_won), now()
  FROM quiz_runs WHERE user_id = p_user_id AND outcome IS NOT NULL AND chosen_category IS NOT NULL AND started_at >= date_trunc('week', now()) GROUP BY chosen_category;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_user_leaderboard(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_leaderboards() TO service_role;
