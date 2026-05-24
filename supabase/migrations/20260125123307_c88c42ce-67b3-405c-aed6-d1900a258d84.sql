-- Create enum types
CREATE TYPE public.app_role AS ENUM ('user', 'admin');
CREATE TYPE public.access_tier AS ENUM ('free', 'standard', 'premium');
CREATE TYPE public.quiz_mode AS ENUM ('category', 'wwtbam');
CREATE TYPE public.quiz_outcome AS ENUM ('completed', 'failed', 'quit', 'timeout');
CREATE TYPE public.question_category AS ENUM (
  'biology', 'chemistry', 'microbiology', 'data_science', 'medicine',
  'gmat', 'gre', 'a_level', 'gcse', 'general_knowledge', 'physics', 'mathematics'
);
CREATE TYPE public.leaderboard_period AS ENUM ('all_time', 'monthly', 'weekly');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  access_tier access_tier NOT NULL DEFAULT 'free',
  standard_purchased_at TIMESTAMP WITH TIME ZONE,
  premium_purchased_at TIMESTAMP WITH TIME ZONE,
  free_plays_remaining INTEGER NOT NULL DEFAULT 3,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category question_category NOT NULL,
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 15),
  stem TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  tags TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_runs table
CREATE TABLE public.quiz_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mode quiz_mode NOT NULL,
  chosen_category question_category,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  current_question_index INTEGER NOT NULL DEFAULT 1,
  answers JSONB NOT NULL DEFAULT '[]'::JSONB,
  outcome quiz_outcome,
  money_won INTEGER NOT NULL DEFAULT 0,
  guaranteed_money_won INTEGER NOT NULL DEFAULT 0,
  lifelines_used JSONB NOT NULL DEFAULT '{"fifty_fifty": false, "ask_ai": false, "skip": false, "time_freeze": false}'::JSONB,
  streak_at_start INTEGER NOT NULL DEFAULT 0,
  streak_at_end INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leaderboard_entries table
CREATE TABLE public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period leaderboard_period NOT NULL,
  category question_category,
  best_money_won INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, period, category)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public profiles for leaderboard"
  ON public.profiles FOR SELECT
  USING (true);

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Questions policies (everyone can read active, admins can manage)
CREATE POLICY "Anyone can view active questions"
  ON public.questions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all questions"
  ON public.questions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert questions"
  ON public.questions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update questions"
  ON public.questions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Quiz runs policies
CREATE POLICY "Users can view their own quiz runs"
  ON public.quiz_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz runs"
  ON public.quiz_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz runs"
  ON public.quiz_runs FOR UPDATE
  USING (auth.uid() = user_id);

-- Leaderboard policies (public read, own write)
CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard_entries FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own entries"
  ON public.leaderboard_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON public.leaderboard_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to reset daily free plays
CREATE OR REPLACE FUNCTION public.reset_daily_free_plays()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_reset_date < CURRENT_DATE THEN
    NEW.free_plays_remaining := 3;
    NEW.last_reset_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER reset_free_plays_on_access
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_daily_free_plays();

-- Create indexes for performance
CREATE INDEX idx_questions_category ON public.questions(category);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty_level);
CREATE INDEX idx_questions_active ON public.questions(is_active);
CREATE INDEX idx_quiz_runs_user ON public.quiz_runs(user_id);
CREATE INDEX idx_quiz_runs_mode ON public.quiz_runs(mode);
CREATE INDEX idx_leaderboard_period ON public.leaderboard_entries(period);
CREATE INDEX idx_leaderboard_money ON public.leaderboard_entries(best_money_won DESC);