-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, user_type, sampradaya, location, bio, languages, experience_years, specializations)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'grihasta')::public.user_type,
    COALESCE(NEW.raw_user_meta_data->>'sampradaya', 'madhva')::public.sampradaya,
    COALESCE(NEW.raw_user_meta_data->>'location', ''),
    COALESCE(NEW.raw_user_meta_data->>'bio', ''),
    COALESCE(
      CASE 
        WHEN NEW.raw_user_meta_data->>'languages' IS NOT NULL 
        THEN string_to_array(NEW.raw_user_meta_data->>'languages', ',')
        ELSE ARRAY['english']
      END,
      ARRAY['english']
    ),
    CASE 
      WHEN NEW.raw_user_meta_data->>'experience_years' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'experience_years')::integer
      ELSE NULL
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'specializations' IS NOT NULL 
      THEN string_to_array(NEW.raw_user_meta_data->>'specializations', ',')
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$;

-- Fix the update function as well
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;