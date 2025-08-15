-- Fix infinite recursion in profiles RLS policies
-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous profile access" ON public.profiles;

-- Create a security definer function to check user roles safely
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS public.user_type
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT user_type FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Recreate the policies without recursion
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view connected profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id OR
  (user_type = 'acharya' AND availability = true AND can_discover_acharya_profile(auth.uid(), user_id)) OR
  (user_type = 'grihasta' AND can_view_pending_profile(auth.uid(), user_id)) OR
  (user_type = 'acharya' AND has_active_connection(auth.uid(), user_id)) OR
  (user_type = 'grihasta' AND has_active_connection(auth.uid(), user_id))
);