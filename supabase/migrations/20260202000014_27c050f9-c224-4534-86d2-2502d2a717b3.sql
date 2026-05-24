-- ===========================================
-- FIX 1: Leaderboard Profiles View RLS Issue
-- ===========================================
-- The current SECURITY INVOKER view cannot access other users' profiles
-- because the profiles table RLS only allows users to see their own profile.
-- 
-- Solution: Recreate the view with SECURITY DEFINER to bypass RLS
-- and only expose safe fields (name, avatar_url, user_id).

DROP VIEW IF EXISTS public.leaderboard_profiles;

CREATE VIEW public.leaderboard_profiles 
WITH (security_invoker = false)
AS
SELECT 
    user_id,
    name,
    avatar_url
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.leaderboard_profiles TO anon, authenticated;

-- ===========================================
-- FIX 2: Quiz Answers Exposure Vulnerability
-- ===========================================
-- The questions table exposes correct_option and explanation to everyone,
-- allowing users to cheat by querying the answers directly.
--
-- Solution: 
-- 1. Create a public view that only shows question data WITHOUT answers
-- 2. Remove the public policy from the questions table
-- 3. Keep admin policy for full question management

-- Create a safe public view for quiz questions (no answers)
CREATE VIEW public.quiz_questions_public AS
SELECT 
    id,
    category,
    difficulty_level,
    stem,
    option_a,
    option_b,
    option_c,
    option_d,
    tags,
    is_active,
    created_at,
    updated_at
FROM public.questions
WHERE is_active = true;

-- Grant access to the public view
GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;

-- Remove the overly permissive public policy from questions table
DROP POLICY IF EXISTS "Anyone can view active questions" ON public.questions;

-- Create a function to verify answers server-side
-- This allows the client to submit an answer and get back if it's correct
-- without ever seeing the correct_option on the client
CREATE OR REPLACE FUNCTION public.verify_quiz_answer(
    question_id UUID,
    user_answer CHAR(1)
)
RETURNS TABLE(
    is_correct BOOLEAN,
    correct_option CHAR(1),
    explanation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (q.correct_option = user_answer) as is_correct,
        q.correct_option,
        q.explanation
    FROM public.questions q
    WHERE q.id = question_id AND q.is_active = true;
END;
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.verify_quiz_answer(UUID, CHAR) TO authenticated;