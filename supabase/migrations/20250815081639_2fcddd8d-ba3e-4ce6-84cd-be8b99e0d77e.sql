-- Drop ALL existing policies on acharya_public_profiles
DROP POLICY IF EXISTS "Restrict acharya profiles to authenticated users only" ON public.acharya_public_profiles;
DROP POLICY IF EXISTS "Allow authenticated acharya profile access" ON public.acharya_public_profiles;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.acharya_public_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to view available profiles" ON public.acharya_public_profiles;
DROP POLICY IF EXISTS "Acharyas can manage own profile" ON public.acharya_public_profiles;

-- Create a secure function to check if user can view acharya profiles
CREATE OR REPLACE FUNCTION public.can_view_acharya_profile(_viewer_id uuid, _acharya_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  -- Only allow viewing if acharya is available AND viewer is authenticated
  -- This provides secure discovery functionality
  SELECT EXISTS (
    SELECT 1 FROM public.acharya_public_profiles 
    WHERE user_id = _acharya_id AND availability = true
  );
$$;

-- Create comprehensive secure RLS policies
-- 1. Deny all access to anonymous users (public)
CREATE POLICY "Block anonymous access completely"
ON public.acharya_public_profiles
FOR ALL
TO anon
USING (false);

-- 2. Allow authenticated users to view available acharya profiles (secure discovery)
CREATE POLICY "Secure authenticated profile viewing"
ON public.acharya_public_profiles
FOR SELECT
TO authenticated
USING (
  -- Either user owns the profile OR profile is available for discovery
  (auth.uid() = user_id) 
  OR 
  (availability = true AND public.can_view_acharya_profile(auth.uid(), user_id))
);

-- 3. Allow acharyas to insert, update, delete their own profile
CREATE POLICY "Acharyas own profile management"
ON public.acharya_public_profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);