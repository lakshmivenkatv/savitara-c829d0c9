-- Fix the conversations RLS policy
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can create conversations with Acharyas" ON public.conversations;
DROP POLICY IF EXISTS "Grihasta can create conversations with Acharyas" ON public.conversations;

-- Create a cleaner, simpler policy
CREATE POLICY "Allow authenticated users to create conversations with acharyas" 
ON public.conversations 
FOR INSERT 
WITH CHECK (
    auth.uid() = grihasta_id 
    AND 
    EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE profiles.user_id = conversations.acharya_id 
        AND profiles.user_type = 'acharya'
    )
);