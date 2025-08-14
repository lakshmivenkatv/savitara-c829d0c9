-- Create connection requests table
CREATE TABLE public.connection_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    grihasta_id UUID NOT NULL,
    acharya_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(grihasta_id, acharya_id)
);

-- Enable RLS
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connection_requests
CREATE POLICY "Users can create connection requests as grihasta" 
ON public.connection_requests 
FOR INSERT 
WITH CHECK (auth.uid() = grihasta_id);

CREATE POLICY "Users can view their connection requests" 
ON public.connection_requests 
FOR SELECT 
USING (auth.uid() = grihasta_id OR auth.uid() = acharya_id);

CREATE POLICY "Acharyas can update connection requests sent to them" 
ON public.connection_requests 
FOR UPDATE 
USING (auth.uid() = acharya_id);

-- Add trigger for updated_at
CREATE TRIGGER update_connection_requests_updated_at
BEFORE UPDATE ON public.connection_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles RLS policy to allow viewing connected Grihasta profiles
CREATE POLICY "Acharyas can view connected Grihasta profiles" 
ON public.profiles 
FOR SELECT 
USING (
    user_type = 'grihasta' 
    AND 
    EXISTS (
        SELECT 1 
        FROM connection_requests 
        WHERE connection_requests.grihasta_id = profiles.user_id 
        AND connection_requests.acharya_id = auth.uid()
        AND connection_requests.status = 'accepted'
    )
);

-- Update conversations policy to require accepted connection
DROP POLICY "Authenticated users can create conversations" ON public.conversations;

CREATE POLICY "Users can create conversations with accepted connections" 
ON public.conversations 
FOR INSERT 
WITH CHECK (
    auth.uid() = grihasta_id 
    AND 
    EXISTS (
        SELECT 1 
        FROM connection_requests 
        WHERE connection_requests.grihasta_id = auth.uid()
        AND connection_requests.acharya_id = conversations.acharya_id
        AND connection_requests.status = 'accepted'
    )
);