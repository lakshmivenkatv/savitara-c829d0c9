-- Fix infinite recursion in profiles RLS policies by removing all and recreating them properly
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Acharyas can view connected Grihasta profiles only" ON public.profiles;
DROP POLICY IF EXISTS "Acharyas can view pending request profiles only" ON public.profiles;
DROP POLICY IF EXISTS "Grihastas can view connected Acharya profiles only" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous profile access" ON public.profiles;
DROP POLICY IF EXISTS "Grihastas can discover available acharyas" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view connected profiles" ON public.profiles;

-- Create a security definer function to check user roles safely (only if not exists)
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS public.user_type
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT user_type FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Recreate clean policies without recursion
CREATE POLICY "Allow own profile access" 
ON public.profiles 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow acharya discovery"
ON public.profiles
FOR SELECT
USING (
  user_type = 'acharya' 
  AND availability = true 
  AND can_discover_acharya_profile(auth.uid(), user_id)
);

CREATE POLICY "Allow connected profile viewing"
ON public.profiles
FOR SELECT
USING (
  has_active_connection(auth.uid(), user_id) OR
  can_view_pending_profile(auth.uid(), user_id)
);

-- Allow admins to manage all profiles using the security definer function
CREATE POLICY "Admin full access"
ON public.profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.user_type = 'admin'
  )
);