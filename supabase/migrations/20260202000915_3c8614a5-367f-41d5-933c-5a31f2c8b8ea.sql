-- Phase 1: Add explicit DENY policies for anonymous users

-- Deny anonymous access to profiles (protects emails and purchase history)
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR SELECT 
TO anon 
USING (false);

-- Deny anonymous access to questions (protects correct answers)
CREATE POLICY "Deny anonymous access to questions" 
ON public.questions 
FOR SELECT 
TO anon 
USING (false);

-- Deny anonymous access to quiz_runs (protects gaming/financial data)
CREATE POLICY "Deny anonymous access to quiz_runs" 
ON public.quiz_runs 
FOR SELECT 
TO anon 
USING (false);

-- Grant explicit access to public quiz questions view for authenticated users
GRANT SELECT ON public.quiz_questions_public TO authenticated;
GRANT SELECT ON public.quiz_questions_public TO anon;