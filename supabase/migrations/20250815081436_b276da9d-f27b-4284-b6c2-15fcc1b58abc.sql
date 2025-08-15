-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Deny unauthenticated access to acharya profiles" ON public.acharya_public_profiles;
DROP POLICY IF EXISTS "Only authenticated users can view public Acharya profiles" ON public.acharya_public_profiles;

-- Create a secure function to check if user can view acharya profiles
CREATE OR REPLACE FUNCTION public.can_view_acharya_profile(_viewer_id uuid, _acharya_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  -- Allow viewing if:
  -- 1. Viewer has an active connection with this acharya
  -- 2. Viewer has sent a pending request to this acharya (to see basic info)
  -- 3. Acharya is available and viewer is authenticated (basic discovery)
  SELECT EXISTS (
    -- Check for active connection
    SELECT 1 FROM public.connection_requests 
    WHERE (
      (grihasta_id = _viewer_id AND acharya_id = _acharya_id AND status = 'accepted')
      OR 
      -- Allow basic profile viewing for discovery if acharya is available
      (EXISTS (
        SELECT 1 FROM public.acharya_public_profiles 
        WHERE user_id = _acharya_id AND availability = true
      ))
    )
  );
$$;

-- Create secure RLS policies for acharya_public_profiles
CREATE POLICY "Authenticated users can view available acharya profiles"
ON public.acharya_public_profiles
FOR SELECT
TO authenticated
USING (
  availability = true 
  AND public.can_view_acharya_profile(auth.uid(), user_id)
);

-- Create policy for acharyas to view their own profile
CREATE POLICY "Acharyas can view their own profile"
ON public.acharya_public_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Ensure no public access at all
CREATE POLICY "Deny all public access to acharya profiles"
ON public.acharya_public_profiles
FOR ALL
TO anon
USING (false);

-- Create policy for updating own profile (acharyas only)
CREATE POLICY "Acharyas can update their own profile"
ON public.acharya_public_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for inserting profile (should be handled by trigger, but add for safety)
CREATE POLICY "Acharyas can insert their own profile"
ON public.acharya_public_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);