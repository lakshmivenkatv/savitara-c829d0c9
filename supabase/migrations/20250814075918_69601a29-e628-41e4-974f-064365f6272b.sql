-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.sync_acharya_public_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;