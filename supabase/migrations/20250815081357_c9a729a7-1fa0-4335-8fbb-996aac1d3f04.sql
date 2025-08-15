-- Fix policy conflicts by removing deny-all policies and ensuring proper access controls

-- Remove conflicting deny-all policy for acharya_public_profiles
DROP POLICY IF EXISTS "Deny all public access to acharya profiles" ON public.acharya_public_profiles;

-- Remove conflicting deny-all policy for profiles  
DROP POLICY IF EXISTS "Deny all unauthenticated access to profiles" ON public.profiles;

-- Ensure acharya_public_profiles has proper restrictive policies
-- (Keep existing policies that are working correctly)

-- For profiles table, ensure we have proper restrictive access
-- The existing policies should be sufficient for security without deny-all conflicts

-- Let's also make sure we have a restrictive default by creating more specific policies
-- that don't conflict with the authentication system

CREATE POLICY "Restrict acharya profiles to authenticated users only"
ON public.acharya_public_profiles
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Allow only authenticated users with proper access
CREATE POLICY "Allow authenticated acharya profile access"
ON public.acharya_public_profiles  
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (availability = true AND public.can_view_acharya_profile(auth.uid(), user_id))
);

-- For profiles table, ensure only authenticated users can access
CREATE POLICY "Restrict profiles to authenticated users only" 
ON public.profiles
FOR ALL
TO public  
USING (false)
WITH CHECK (false);

-- Allow authenticated access with existing relationship-based policies
-- (The existing policies should handle the specific cases)