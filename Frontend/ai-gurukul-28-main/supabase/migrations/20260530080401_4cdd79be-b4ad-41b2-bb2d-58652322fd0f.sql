-- Allow any authenticated user to read published lessons
CREATE POLICY "lessons_select_published"
ON public.lessons FOR SELECT
TO authenticated
USING (status = 'published');

-- Allow reading child content for published lessons
CREATE POLICY "lc_select_published"
ON public.lesson_content FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_content.lesson_id AND l.status = 'published'));

CREATE POLICY "ws_select_published"
ON public.worksheets FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = worksheets.lesson_id AND l.status = 'published'));

CREATE POLICY "qz_select_published"
ON public.quizzes FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = quizzes.lesson_id AND l.status = 'published'));

CREATE POLICY "rb_select_published"
ON public.rubrics FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = rubrics.lesson_id AND l.status = 'published'));

CREATE POLICY "ak_select_published"
ON public.answer_keys FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = answer_keys.lesson_id AND l.status = 'published'));