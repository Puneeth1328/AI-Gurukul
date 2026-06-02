-- Helper: does the current auth user have a given role on their profile?
CREATE OR REPLACE FUNCTION public.current_user_has_role(_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND LOWER(COALESCE(role, '')) = LOWER(_role)
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_user_has_role(text) TO authenticated;

-- Tutors can read every lesson + child content row across the platform.
CREATE POLICY lessons_select_tutor ON public.lessons
  FOR SELECT TO authenticated
  USING (public.current_user_has_role('tutor'));

CREATE POLICY lc_select_tutor ON public.lesson_content
  FOR SELECT TO authenticated
  USING (public.current_user_has_role('tutor'));

CREATE POLICY ws_select_tutor ON public.worksheets
  FOR SELECT TO authenticated
  USING (public.current_user_has_role('tutor'));

CREATE POLICY qz_select_tutor ON public.quizzes
  FOR SELECT TO authenticated
  USING (public.current_user_has_role('tutor'));

CREATE POLICY rb_select_tutor ON public.rubrics
  FOR SELECT TO authenticated
  USING (public.current_user_has_role('tutor'));

CREATE POLICY ak_select_tutor ON public.answer_keys
  FOR SELECT TO authenticated
  USING (public.current_user_has_role('tutor'));