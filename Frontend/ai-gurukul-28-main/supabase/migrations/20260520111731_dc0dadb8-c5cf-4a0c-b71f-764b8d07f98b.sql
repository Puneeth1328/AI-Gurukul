
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  school_name TEXT,
  role TEXT DEFAULT 'Teacher',
  language_preference TEXT DEFAULT 'English',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, language_preference)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Teacher'),
    COALESCE(NEW.raw_user_meta_data->>'language_preference', 'English')
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Lessons
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  topic TEXT NOT NULL,
  duration TEXT,
  objectives TEXT,
  language TEXT DEFAULT 'English',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  generation_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX lessons_user_id_idx ON public.lessons(user_id);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_select_own" ON public.lessons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "lessons_insert_own" ON public.lessons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lessons_update_own" ON public.lessons FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "lessons_delete_own" ON public.lessons FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper to create content tables
-- lesson_content
CREATE TABLE public.lesson_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX lesson_content_lesson_id_idx ON public.lesson_content(lesson_id);
ALTER TABLE public.lesson_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lc_select_own" ON public.lesson_content FOR SELECT USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
CREATE POLICY "lc_insert_own" ON public.lesson_content FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
CREATE POLICY "lc_update_own" ON public.lesson_content FOR UPDATE USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
CREATE POLICY "lc_delete_own" ON public.lesson_content FOR DELETE USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));

-- worksheets
CREATE TABLE public.worksheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX worksheets_lesson_id_idx ON public.worksheets(lesson_id);
ALTER TABLE public.worksheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_select_own" ON public.worksheets FOR SELECT USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
CREATE POLICY "ws_insert_own" ON public.worksheets FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
CREATE POLICY "ws_update_own" ON public.worksheets FOR UPDATE USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
CREATE POLICY "ws_delete_own" ON public.worksheets FOR DELETE USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));

-- quizzes
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_marks INTEGER DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX quizzes_lesson_id_idx ON public.quizzes(lesson_id);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qz_select_own" ON public.quizzes FOR SELECT USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
CREATE POLICY "qz_insert_own" ON public.quizzes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
CREATE POLICY "qz_update_own" ON public.quizzes FOR UPDATE USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
CREATE POLICY "qz_delete_own" ON public.quizzes FOR DELETE USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));

-- rubrics
CREATE TABLE public.rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX rubrics_lesson_id_idx ON public.rubrics(lesson_id);
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rb_select_own" ON public.rubrics FOR SELECT USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
CREATE POLICY "rb_insert_own" ON public.rubrics FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
CREATE POLICY "rb_update_own" ON public.rubrics FOR UPDATE USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
CREATE POLICY "rb_delete_own" ON public.rubrics FOR DELETE USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));

-- answer_keys
CREATE TABLE public.answer_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX answer_keys_lesson_id_idx ON public.answer_keys(lesson_id);
ALTER TABLE public.answer_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ak_select_own" ON public.answer_keys FOR SELECT USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
CREATE POLICY "ak_insert_own" ON public.answer_keys FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
CREATE POLICY "ak_update_own" ON public.answer_keys FOR UPDATE USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
CREATE POLICY "ak_delete_own" ON public.answer_keys FOR DELETE USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_id AND l.user_id = auth.uid()));
