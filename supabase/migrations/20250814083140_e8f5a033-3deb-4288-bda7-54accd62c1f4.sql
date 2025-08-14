-- Create a simpler RLS policy that should definitely work
DROP POLICY IF EXISTS "Allow authenticated users to create conversations with acharyas" ON public.conversations;

-- Create a simple policy that allows any authenticated user to create conversations
CREATE POLICY "Authenticated users can create conversations" 
ON public.conversations 
FOR INSERT 
TO authenticated
WITH CHECK (
    auth.uid() = grihasta_id
);