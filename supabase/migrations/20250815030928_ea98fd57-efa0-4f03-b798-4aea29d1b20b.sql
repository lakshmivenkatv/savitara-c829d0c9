-- First, let's add comprehensive RLS policies for the profiles table
-- to ensure proper access control and fix security vulnerabilities

-- Drop existing policies that might have security gaps
DROP POLICY IF EXISTS "Acharyas can view Grihasta profiles for pending requests" ON public.profiles;
DROP POLICY IF EXISTS "Acharyas can view connected Grihasta profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view Acharya profiles they have conversations with" ON public.profiles;

-- Create a security definer function to check if a user has an active connection
CREATE OR REPLACE FUNCTION public.has_active_connection(_viewer_id uuid, _profile_user_id uuid)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connection_requests 
    WHERE (
      (grihasta_id = _viewer_id AND acharya_id = _profile_user_id AND status = 'accepted') OR
      (acharya_id = _viewer_id AND grihasta_id = _profile_user_id AND status = 'accepted')
    )
  );
$$;

-- Create a security definer function to check if a user has a pending connection request they can view
CREATE OR REPLACE FUNCTION public.can_view_pending_profile(_viewer_id uuid, _profile_user_id uuid)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connection_requests 
    WHERE acharya_id = _viewer_id AND grihasta_id = _profile_user_id AND status = 'pending'
  );
$$;

-- Create more secure RLS policies with explicit authentication checks

-- Policy 1: Users can only view their own profile
CREATE POLICY "Users can view their own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Acharyas can view Grihasta profiles ONLY when they have accepted connections
CREATE POLICY "Acharyas can view connected Grihasta profiles only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_type = 'grihasta'::user_type 
  AND public.has_active_connection(auth.uid(), user_id)
);

-- Policy 3: Acharyas can view Grihasta profiles ONLY for pending requests they received
CREATE POLICY "Acharyas can view pending request profiles only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_type = 'grihasta'::user_type 
  AND public.can_view_pending_profile(auth.uid(), user_id)
);

-- Policy 4: Grihastas can view Acharya profiles ONLY when they have accepted connections
CREATE POLICY "Grihastas can view connected Acharya profiles only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_type = 'acharya'::user_type 
  AND public.has_active_connection(auth.uid(), user_id)
);

-- Policy 5: Users can create their own profile (unchanged but with explicit auth check)
-- Note: We keep the existing policy name to avoid breaking existing functionality
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 6: Users can update their own profile (unchanged but with explicit auth check)
-- Note: We keep the existing policy name to avoid breaking existing functionality
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Additional security: Ensure no unauthenticated access is possible
-- Create a catch-all policy that explicitly denies access to unauthenticated users
CREATE POLICY "Deny all unauthenticated access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- Also fix the acharya_public_profiles table to require authentication
DROP POLICY IF EXISTS "Authenticated users can view public Acharya profiles" ON public.acharya_public_profiles;
CREATE POLICY "Only authenticated users can view public Acharya profiles"
ON public.acharya_public_profiles
FOR SELECT
TO authenticated
USING (availability = true);

-- Add explicit denial for unauthenticated users on acharya_public_profiles
CREATE POLICY "Deny unauthenticated access to acharya profiles"
ON public.acharya_public_profiles
FOR ALL
TO anon
USING (false);