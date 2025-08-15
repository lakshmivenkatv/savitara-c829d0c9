-- Add admin to user_type enum in a transaction
BEGIN;
ALTER TYPE public.user_type ADD VALUE 'admin';
COMMIT;

-- Create RLS policy for admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
  )
);

-- Create RLS policy for admins to manage all acharya public profiles
CREATE POLICY "Admins can manage all acharya public profiles" 
ON public.acharya_public_profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
  )
);