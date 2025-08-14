-- Fix the security definer issue by recreating the view without SECURITY DEFINER
-- and using RLS instead
DROP VIEW IF EXISTS public.acharya_public_profiles;

-- Create a table instead of a view for better RLS control
CREATE TABLE public.acharya_public_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    sampradaya text NOT NULL,
    location text,
    bio_preview text,
    experience_years integer,
    specializations text[],
    languages text[],
    availability boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the public profiles table
ALTER TABLE public.acharya_public_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to limited Acharya info
CREATE POLICY "Authenticated users can view public Acharya profiles" 
ON public.acharya_public_profiles 
FOR SELECT 
TO authenticated
USING (availability = true);

-- Create function to sync public profiles from main profiles
CREATE OR REPLACE FUNCTION public.sync_acharya_public_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT or UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Only sync if it's an Acharya profile
        IF NEW.user_type = 'acharya' THEN
            INSERT INTO public.acharya_public_profiles (
                user_id, full_name, sampradaya, location, bio_preview, 
                experience_years, specializations, languages, availability, created_at, updated_at
            ) VALUES (
                NEW.user_id,
                NEW.full_name,
                NEW.sampradaya,
                CASE 
                    WHEN NEW.location IS NOT NULL THEN 
                        CASE 
                            WHEN position(',' in NEW.location) > 0 
                            THEN split_part(NEW.location, ',', 1) 
                            ELSE NEW.location 
                        END
                    ELSE NULL 
                END,
                CASE 
                    WHEN NEW.bio IS NOT NULL AND length(NEW.bio) > 100 
                    THEN left(NEW.bio, 100) || '...' 
                    ELSE NEW.bio 
                END,
                NEW.experience_years,
                NEW.specializations,
                NEW.languages,
                NEW.availability,
                NEW.created_at,
                NEW.updated_at
            )
            ON CONFLICT (user_id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                sampradaya = EXCLUDED.sampradaya,
                location = EXCLUDED.location,
                bio_preview = EXCLUDED.bio_preview,
                experience_years = EXCLUDED.experience_years,
                specializations = EXCLUDED.specializations,
                languages = EXCLUDED.languages,
                availability = EXCLUDED.availability,
                updated_at = EXCLUDED.updated_at;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        DELETE FROM public.acharya_public_profiles WHERE user_id = OLD.user_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create unique constraint on user_id
ALTER TABLE public.acharya_public_profiles ADD CONSTRAINT acharya_public_profiles_user_id_key UNIQUE (user_id);

-- Create trigger to sync data
CREATE TRIGGER sync_acharya_public_profile_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_acharya_public_profile();

-- Populate existing data
INSERT INTO public.acharya_public_profiles (
    user_id, full_name, sampradaya, location, bio_preview, 
    experience_years, specializations, languages, availability, created_at, updated_at
)
SELECT 
    user_id,
    full_name,
    sampradaya,
    CASE 
        WHEN location IS NOT NULL THEN 
            CASE 
                WHEN position(',' in location) > 0 
                THEN split_part(location, ',', 1) 
                ELSE location 
            END
        ELSE NULL 
    END,
    CASE 
        WHEN bio IS NOT NULL AND length(bio) > 100 
        THEN left(bio, 100) || '...' 
        ELSE bio 
    END,
    experience_years,
    specializations,
    languages,
    availability,
    created_at,
    updated_at
FROM public.profiles 
WHERE user_type = 'acharya'
ON CONFLICT (user_id) DO NOTHING;