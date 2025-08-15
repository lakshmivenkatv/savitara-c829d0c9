-- Fix infinite recursion completely by using security definer functions
-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow own profile access" ON public.profiles;
DROP POLICY IF EXISTS "Allow acharya discovery" ON public.profiles;
DROP POLICY IF EXISTS "Allow connected profile viewing" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access" ON public.profiles;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND user_type = 'admin'
  );
$$;

-- Create clean, non-recursive policies
CREATE POLICY "Users can manage own profile" 
ON public.profiles 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Acharya profile discovery"
ON public.profiles
FOR SELECT
USING (
  user_type = 'acharya' 
  AND availability = true 
  AND can_discover_acharya_profile(auth.uid(), user_id)
);

CREATE POLICY "Connected profile access"
ON public.profiles
FOR SELECT
USING (
  has_active_connection(auth.uid(), user_id) OR
  can_view_pending_profile(auth.uid(), user_id)
);

-- Admin access using the security definer function
CREATE POLICY "Admin manages all"
ON public.profiles
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());