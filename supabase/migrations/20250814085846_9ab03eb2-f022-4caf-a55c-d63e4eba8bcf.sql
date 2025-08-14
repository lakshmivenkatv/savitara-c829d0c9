-- Add RLS policy to allow Acharyas to view Grihasta profiles for pending connection requests
CREATE POLICY "Acharyas can view Grihasta profiles for pending requests" 
ON public.profiles 
FOR SELECT 
USING (
  user_type = 'grihasta'::user_type AND 
  EXISTS (
    SELECT 1
    FROM connection_requests
    WHERE connection_requests.grihasta_id = profiles.user_id 
    AND connection_requests.acharya_id = auth.uid() 
    AND connection_requests.status = 'pending'
  )
);