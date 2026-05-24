
-- Add previous_rank to leaderboard_entries for rank change tracking
ALTER TABLE public.leaderboard_entries
ADD COLUMN IF NOT EXISTS previous_rank integer DEFAULT NULL;
