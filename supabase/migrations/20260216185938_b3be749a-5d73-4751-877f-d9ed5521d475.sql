
-- Fix search_path warning on coalesce_category
CREATE OR REPLACE FUNCTION public.coalesce_category(cat question_category)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$ SELECT COALESCE(cat::text, '__none__') $$;
