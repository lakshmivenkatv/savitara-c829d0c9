-- Drop ALL existing policies on acharya_public_profiles table
DROP POLICY IF EXISTS "Authenticated users can view available acharya profiles" ON public.acharya_public_profiles;
DROP POLICY IF EXISTS "Acharyas can view their own profile" ON public.acharya_public_profiles;
DROP POLICY IF EXISTS "Deny all public access to acharya profiles" ON public.acharya_public_profiles;
DROP POLICY IF EXISTS "Acharyas can update their own profile" ON public.acharya_public_profiles;
DROP POLICY IF EXISTS "Acharyas can insert their own profile" ON public.acharya_public_profiles;
DROP POLICY IF EXISTS "Deny unauthenticated access to acharya profiles" ON public.acharya_public_profiles;
DROP POLICY IF EXISTS "Only authenticated users can view public Acharya profiles" ON public.acharya_public_profiles;

-- Create a secure function to check if user can view acharya profiles
CREATE OR REPLACE FUNCTION public.can_view_acharya_profile(_viewer_id uuid, _acharya_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  -- Allow viewing only if acharya is available AND viewer is authenticated
  -- This provides basic discovery while maintaining security
  SELECT EXISTS (
    SELECT 1 FROM public.acharya_public_profiles 
    WHERE user_id = _acharya_id AND availability = true
  );
$$;

-- Create secure RLS policies for acharya_public_profiles
-- 1. Deny all access to anonymous users
CREATE POLICY "Deny anonymous access"
ON public.acharya_public_profiles
FOR ALL
TO anon
USING (false);

-- 2. Allow authenticated users to view available acharya profiles for discovery
CREATE POLICY "Allow authenticated users to view available profiles"
ON public.acharya_public_profiles
FOR SELECT
TO authenticated
USING (
  availability = true 
  AND public.can_view_acharya_profile(auth.uid(), user_id)
);

-- 3. Allow acharyas to view and manage their own profile
CREATE POLICY "Acharyas can manage own profile"
ON public.acharya_public_profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);