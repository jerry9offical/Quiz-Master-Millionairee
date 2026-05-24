
-- Rewrite get_quiz_session_questions with strict difficulty bands
-- Q1-4: difficulty 1-7, Q5-10: difficulty 8-12, Q11-15: difficulty 13-15
CREATE OR REPLACE FUNCTION public.get_quiz_session_questions(
  p_user_id uuid DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_is_premium boolean DEFAULT false
)
RETURNS TABLE(
  id uuid, stem text, option_a text, option_b text, option_c text, option_d text,
  difficulty_level integer, category text, is_premium boolean,
  round_number integer, pack_label text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_round int;
  v_diff_min int;
  v_diff_max int;
  v_widen_min int;
  v_question_id uuid;
  v_pack_id uuid;
  v_pack_type text;
  v_session_ids uuid[] := '{}';
  v_fallback_step int;
BEGIN
  -- Find active pack
  SELECT qp.id, qp.pack_type INTO v_pack_id, v_pack_type
  FROM question_packs qp
  WHERE qp.active = true
    AND now() BETWEEN qp.starts_at AND qp.ends_at
    AND (p_category IS NULL OR qp.category = p_category)
    AND (
      (p_is_premium AND qp.pack_type = 'weekly_premium')
      OR (NOT p_is_premium AND qp.pack_type IN ('daily', 'weekly'))
    )
  ORDER BY
    CASE WHEN qp.pack_type = 'weekly_premium' THEN 1
         WHEN qp.pack_type = 'daily' THEN 2
         ELSE 3 END
  LIMIT 1;

  FOR v_round IN 1..15 LOOP
    -- Strict difficulty bands
    IF v_round <= 4 THEN
      v_diff_min := 1; v_diff_max := 7; v_widen_min := 1;
    ELSIF v_round <= 10 THEN
      v_diff_min := 8; v_diff_max := 12; v_widen_min := 7;
    ELSE
      v_diff_min := 13; v_diff_max := 15; v_widen_min := 12;
    END IF;

    v_question_id := NULL;
    v_fallback_step := 0;

    -- Step 1: Pack + unseen (14-day cooldown)
    IF v_pack_id IS NOT NULL THEN
      SELECT q.id INTO v_question_id
      FROM questions q
      JOIN question_pack_items qpi ON qpi.question_id = q.id AND qpi.pack_id = v_pack_id
      WHERE q.is_active = true
        AND q.difficulty_level BETWEEN v_diff_min AND v_diff_max
        AND (p_category IS NULL OR q.category::text = p_category)
        AND (p_is_premium OR q.is_premium = false)
        AND q.id != ALL(v_session_ids)
        AND (p_user_id IS NULL OR NOT EXISTS (
          SELECT 1 FROM user_seen_questions usq
          WHERE usq.user_id = p_user_id AND usq.question_id = q.id
            AND usq.seen_at > now() - interval '14 days'
        ))
      ORDER BY random()
      LIMIT 1;
      IF v_question_id IS NOT NULL THEN v_fallback_step := 0; END IF;
    END IF;

    -- Step 2: Main bank + unseen (14-day cooldown)
    IF v_question_id IS NULL THEN
      v_fallback_step := 1;
      SELECT q.id INTO v_question_id
      FROM questions q
      WHERE q.is_active = true
        AND q.difficulty_level BETWEEN v_diff_min AND v_diff_max
        AND (p_category IS NULL OR q.category::text = p_category)
        AND (p_is_premium OR q.is_premium = false)
        AND q.id != ALL(v_session_ids)
        AND (p_user_id IS NULL OR NOT EXISTS (
          SELECT 1 FROM user_seen_questions usq
          WHERE usq.user_id = p_user_id AND usq.question_id = q.id
            AND usq.seen_at > now() - interval '14 days'
        ))
      ORDER BY random()
      LIMIT 1;
    END IF;

    -- Step 3: Allow seen >14 days within same band
    IF v_question_id IS NULL THEN
      v_fallback_step := 2;
      SELECT q.id INTO v_question_id
      FROM questions q
      WHERE q.is_active = true
        AND q.difficulty_level BETWEEN v_diff_min AND v_diff_max
        AND (p_category IS NULL OR q.category::text = p_category)
        AND (p_is_premium OR q.is_premium = false)
        AND q.id != ALL(v_session_ids)
      ORDER BY (
        SELECT usq.seen_at FROM user_seen_questions usq
        WHERE usq.user_id = p_user_id AND usq.question_id = q.id
      ) ASC NULLS FIRST, random()
      LIMIT 1;
    END IF;

    -- Step 4: Widen band slightly (never below floor)
    IF v_question_id IS NULL AND v_widen_min < v_diff_min THEN
      v_fallback_step := 3;
      SELECT q.id INTO v_question_id
      FROM questions q
      WHERE q.is_active = true
        AND q.difficulty_level BETWEEN v_widen_min AND v_diff_max
        AND (p_category IS NULL OR q.category::text = p_category)
        AND (p_is_premium OR q.is_premium = false)
        AND q.id != ALL(v_session_ids)
      ORDER BY random()
      LIMIT 1;
    END IF;

    -- If still null, skip this round (not enough questions)
    IF v_question_id IS NOT NULL THEN
      v_session_ids := v_session_ids || v_question_id;

      -- Track seen
      IF p_user_id IS NOT NULL THEN
        INSERT INTO user_seen_questions (user_id, question_id, category)
        SELECT p_user_id, v_question_id, q.category::text
        FROM questions q WHERE q.id = v_question_id
        ON CONFLICT (user_id, question_id) DO UPDATE SET seen_at = now();
      END IF;

      RETURN QUERY
      SELECT q.id, q.stem, q.option_a, q.option_b, q.option_c, q.option_d,
             q.difficulty_level, q.category::text, q.is_premium,
             v_round AS round_number,
             COALESCE(v_pack_type, 'standard') AS pack_label
      FROM questions q WHERE q.id = v_question_id;
    END IF;
  END LOOP;
END;
$function$;

-- Diagnostic view for question inventory per category/difficulty
CREATE OR REPLACE VIEW public.question_inventory AS
SELECT category::text AS category, difficulty_level, COUNT(*) AS question_count
FROM questions
WHERE is_active = true
GROUP BY category, difficulty_level
ORDER BY category, difficulty_level;

-- Grant access to the inventory view for admins (via existing RLS on questions)
GRANT SELECT ON public.question_inventory TO authenticated;
