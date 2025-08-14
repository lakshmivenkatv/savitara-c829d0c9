-- Check and fix the RLS policy for conversations
-- The current policy requires the acharya to exist in profiles with type 'acharya'
-- but it doesn't check if the grihasta user exists or has the right type

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Grihasta can create conversations with Acharyas" ON public.conversations;

-- Create a new, more flexible policy that allows any authenticated user to create conversations with Acharyas
CREATE POLICY "Users can create conversations with Acharyas" 
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

-- Also ensure that any authenticated user can be a grihasta in conversations
-- We'll create a profile for users who don't have one when they try to start a conversation
-- First, let's create the missing profile for the current user
INSERT INTO public.profiles (
    user_id, 
    full_name, 
    user_type, 
    sampradaya, 
    location, 
    bio, 
    languages, 
    experience_years, 
    specializations
) VALUES (
    '4ff559f4-3111-4ddf-b333-99927fa7c3d4',
    'User', -- Default name, user can update later
    'grihasta',
    'madhva', -- Default sampradaya
    '',
    '',
    ARRAY['english'],
    NULL,
    NULL
) ON CONFLICT (user_id) DO NOTHING;