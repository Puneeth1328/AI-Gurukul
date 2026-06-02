-- Normalize existing profile roles to the new allowed set
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

UPDATE public.profiles
SET role = CASE
  WHEN LOWER(COALESCE(role, '')) IN ('teacher') THEN 'teacher'
  WHEN LOWER(COALESCE(role, '')) IN ('tutor') THEN 'tutor'
  WHEN LOWER(COALESCE(role, '')) IN ('student') THEN 'student'
  WHEN LOWER(COALESCE(role, '')) IN ('trainer') THEN 'teacher'
  ELSE 'student'
END;

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'student',
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('teacher','tutor','student'));

-- Update the new-user trigger to write a normalized, allowed role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  raw_role text;
  final_role text;
BEGIN
  raw_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'student'));
  final_role := CASE
    WHEN raw_role IN ('teacher','tutor','student') THEN raw_role
    WHEN raw_role = 'trainer' THEN 'teacher'
    ELSE 'student'
  END;

  INSERT INTO public.profiles (id, full_name, role, language_preference)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    final_role,
    COALESCE(NEW.raw_user_meta_data->>'language_preference', 'English')
  );
  RETURN NEW;
END;
$function$;