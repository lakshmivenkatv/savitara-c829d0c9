-- Create a function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, user_type, sampradaya)
  VALUES (NEW.id, 
          COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
          COALESCE(NEW.raw_user_meta_data->>'user_type', 'grihasta')::user_type,
          COALESCE(NEW.raw_user_meta_data->>'sampradaya', 'madhva')::sampradaya);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();