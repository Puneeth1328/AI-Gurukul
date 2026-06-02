-- 1. profiles.role: normalize to 'teacher'/'student' with default 'student'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'student';
UPDATE public.profiles SET role = LOWER(role) WHERE role IS NOT NULL;
UPDATE public.profiles SET role = 'student' WHERE role IS NULL OR role NOT IN ('teacher','student');
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('teacher','student'));

-- 2. lessons.status: 'draft' / 'published', default 'draft'
ALTER TABLE public.lessons ALTER COLUMN status SET DEFAULT 'draft';
UPDATE public.lessons SET status = 'draft' WHERE status NOT IN ('draft','published');
ALTER TABLE public.lessons ADD CONSTRAINT lessons_status_check CHECK (status IN ('draft','published'));

-- 3. discussions table
CREATE TABLE public.discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.discussions TO authenticated;
GRANT ALL ON public.discussions TO service_role;

ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discussions_select_lesson_accessible"
ON public.discussions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    WHERE l.id = discussions.lesson_id
      AND (l.user_id = auth.uid() OR l.status = 'published')
  )
);

CREATE POLICY "discussions_insert_own"
ON public.discussions FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.lessons l
    WHERE l.id = discussions.lesson_id
      AND (l.user_id = auth.uid() OR l.status = 'published')
  )
);

CREATE POLICY "discussions_update_own"
ON public.discussions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "discussions_delete_own"
ON public.discussions FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_discussions_lesson_id ON public.discussions(lesson_id);

-- Enable realtime for discussions
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussions;