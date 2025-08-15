-- Remove the problematic policy that blocks all access
DROP POLICY IF EXISTS "Restrict profiles to authenticated users only" ON public.profiles;

-- Create a function to check if an acharya profile can be discovered
CREATE OR REPLACE FUNCTION public.can_discover_acharya_profile(_viewer_id uuid, _acharya_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  -- Allow discovery of acharya profiles that are available
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _acharya_id 
    AND user_type = 'acharya' 
    AND availability = true
  );
$$;

-- Block all anonymous access
CREATE POLICY "Block anonymous profile access"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- Allow grihastas to discover available acharyas for browsing/connection requests
CREATE POLICY "Grihastas can discover available acharyas"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Own profile OR available acharya profiles for discovery
  (auth.uid() = user_id)
  OR
  (user_type = 'acharya' AND availability = true AND public.can_discover_acharya_profile(auth.uid(), user_id))
);