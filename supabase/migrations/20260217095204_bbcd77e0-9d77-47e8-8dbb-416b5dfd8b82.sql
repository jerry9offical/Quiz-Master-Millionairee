
-- 1) Add is_premium flag to questions
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

-- 2) Performance indexes on questions
CREATE INDEX IF NOT EXISTS idx_questions_cat_diff_active 
  ON public.questions (category, difficulty_level) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_questions_cat_premium_active 
  ON public.questions (category, is_premium) WHERE is_active = true;

-- 3) Track seen questions per user (no repeats within cooldown)
CREATE TABLE public.user_seen_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  category text NOT NULL,
  seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.user_seen_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anonymous access to user_seen_questions"
  ON public.user_seen_questions AS RESTRICTIVE
  FOR SELECT TO anon USING (false);

CREATE POLICY "Users can view their own seen questions"
  ON public.user_seen_questions AS RESTRICTIVE
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own seen questions"
  ON public.user_seen_questions AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_seen_cat_date 
  ON public.user_seen_questions (user_id, category, seen_at);

-- 4) Question packs (daily / weekly / weekly_premium)
CREATE TABLE public.question_packs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  pack_type text NOT NULL CHECK (pack_type IN ('daily', 'weekly', 'weekly_premium')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  difficulty_min int NOT NULL DEFAULT 1,
  difficulty_max int NOT NULL DEFAULT 15,
  is_premium boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.question_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packs"
  ON public.question_packs AS RESTRICTIVE
  FOR SELECT USING (active = true);

CREATE INDEX idx_packs_lookup 
  ON public.question_packs (category, pack_type, active, starts_at, ends_at);

-- 5) Pack items (many-to-many: packs ↔ questions)
CREATE TABLE public.question_pack_items (
  pack_id uuid NOT NULL REFERENCES public.question_packs(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  PRIMARY KEY (pack_id, question_id)
);

ALTER TABLE public.question_pack_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pack items"
  ON public.question_pack_items AS RESTRICTIVE
  FOR SELECT USING (true);

-- 6) RPC: get_quiz_session_questions
-- Returns 15 questions with difficulty progression, seen-question exclusion, pack preference
-- Does NOT expose correct_option or explanation (security)
CREATE OR REPLACE FUNCTION public.get_quiz_session_questions(
  p_user_id uuid DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_is_premium boolean DEFAULT false
)
RETURNS TABLE (
  id uuid,
  stem text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  difficulty_level int,
  category text,
  is_premium boolean,
  round_number int,
  pack_label text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_round int;
  v_diff_min int;
  v_diff_max int;
  v_question_id uuid;
  v_pack_id uuid;
  v_pack_type text;
  v_session_ids uuid[] := '{}';
BEGIN
  -- Find active pack for this category/tier
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
    -- Difficulty window by round
    IF v_round <= 3 THEN
      v_diff_min := 1; v_diff_max := 3;
    ELSIF v_round <= 6 THEN
      v_diff_min := 3; v_diff_max := 6;
    ELSIF v_round <= 10 THEN
      v_diff_min := 6; v_diff_max := 10;
    ELSE
      v_diff_min := 10; v_diff_max := 15;
    END IF;

    v_question_id := NULL;

    -- Step 1: Try pack + unseen (if user is logged in)
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
    END IF;

    -- Step 2: Main bank + unseen
    IF v_question_id IS NULL THEN
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

    -- Step 3: Allow repeats, prefer oldest-seen
    IF v_question_id IS NULL THEN
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

    -- Step 4: Widen difficulty to any level
    IF v_question_id IS NULL THEN
      SELECT q.id INTO v_question_id
      FROM questions q
      WHERE q.is_active = true
        AND (p_category IS NULL OR q.category::text = p_category)
        AND (p_is_premium OR q.is_premium = false)
        AND q.id != ALL(v_session_ids)
      ORDER BY random()
      LIMIT 1;
    END IF;

    -- Record and return
    IF v_question_id IS NOT NULL THEN
      v_session_ids := v_session_ids || v_question_id;

      -- Track seen (only for logged-in users)
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
$$;
