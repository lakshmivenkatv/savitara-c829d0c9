-- Add policy for Acharyas to view Grihasta profiles they have conversations with
CREATE POLICY "Acharyas can view Grihasta profiles they have conversations with" 
ON public.profiles 
FOR SELECT 
WITH CHECK (
    user_type = 'grihasta' 
    AND 
    EXISTS (
        SELECT 1 
        FROM conversations 
        WHERE conversations.grihasta_id = profiles.user_id 
        AND conversations.acharya_id = auth.uid()
    )
);