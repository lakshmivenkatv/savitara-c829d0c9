-- First, let's create a view for public Acharya profiles with limited information
CREATE OR REPLACE VIEW public.acharya_public_profiles AS
SELECT 
    id,
    user_id,
    full_name,
    sampradaya,
    CASE 
        WHEN location IS NOT NULL THEN 
            -- Only show city/state, not full address for privacy
            CASE 
                WHEN position(',' in location) > 0 
                THEN split_part(location, ',', 1) 
                ELSE location 
            END
        ELSE NULL 
    END as location,
    -- Truncate bio to first 100 characters for preview
    CASE 
        WHEN bio IS NOT NULL AND length(bio) > 100 
        THEN left(bio, 100) || '...' 
        ELSE bio 
    END as bio_preview,
    experience_years,
    specializations,
    languages,
    availability,
    created_at
FROM public.profiles 
WHERE user_type = 'acharya' AND availability = true;

-- Grant access to authenticated users for the public view
GRANT SELECT ON public.acharya_public_profiles TO authenticated;

-- Now let's update the RLS policies to be more restrictive
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Grihasta can view Acharya profiles" ON public.profiles;

-- Create new restrictive policies
CREATE POLICY "Users can view Acharya profiles they have conversations with" 
ON public.profiles 
FOR SELECT 
USING (
    user_type = 'acharya' AND (
        -- User can see their own profile
        auth.uid() = user_id 
        OR 
        -- User can see Acharya profiles they have active conversations with
        EXISTS (
            SELECT 1 
            FROM public.conversations 
            WHERE (
                (conversations.grihasta_id = auth.uid() AND conversations.acharya_id = profiles.user_id)
                OR 
                (conversations.acharya_id = auth.uid() AND conversations.grihasta_id = profiles.user_id)
            )
        )
    )
);

-- Keep the existing policy for users viewing their own profiles
-- This policy already exists: "Users can view their own profile"