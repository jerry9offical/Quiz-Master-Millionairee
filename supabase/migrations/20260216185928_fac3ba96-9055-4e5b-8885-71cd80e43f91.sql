
-- Immutable wrapper for COALESCE on category
CREATE OR REPLACE FUNCTION public.coalesce_category(cat question_category)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$ SELECT COALESCE(cat::text, '__none__') $$;

CREATE UNIQUE INDEX idx_leaderboard_unique ON leaderboard_entries (user_id, period, public.coalesce_category(category));
