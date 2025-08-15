-- Remove the policy that blocks all anonymous access
DROP POLICY IF EXISTS "Block anonymous access completely" ON public.acharya_public_profiles;

-- Update the viewing policy to allow both anonymous and authenticated users to discover available teachers
DROP POLICY IF EXISTS "Secure authenticated profile viewing" ON public.acharya_public_profiles;

CREATE POLICY "Allow teacher discovery for all users"
ON public.acharya_public_profiles
FOR SELECT
USING (
  -- Own profile (only for authenticated users) OR available profiles for public discovery
  (auth.uid() = user_id) 
  OR 
  (availability = true AND public.can_view_acharya_profile(COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), user_id))
);