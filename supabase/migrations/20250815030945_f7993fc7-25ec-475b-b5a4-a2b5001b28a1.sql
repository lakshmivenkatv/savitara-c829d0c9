-- Fix the search_path security warnings by updating the functions

-- Update the has_active_connection function with proper search_path
CREATE OR REPLACE FUNCTION public.has_active_connection(_viewer_id uuid, _profile_user_id uuid)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connection_requests 
    WHERE (
      (grihasta_id = _viewer_id AND acharya_id = _profile_user_id AND status = 'accepted') OR
      (acharya_id = _viewer_id AND grihasta_id = _profile_user_id AND status = 'accepted')
    )
  );
$$;

-- Update the can_view_pending_profile function with proper search_path
CREATE OR REPLACE FUNCTION public.can_view_pending_profile(_viewer_id uuid, _profile_user_id uuid)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connection_requests 
    WHERE acharya_id = _viewer_id AND grihasta_id = _profile_user_id AND status = 'pending'
  );
$$;