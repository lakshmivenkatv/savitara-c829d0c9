-- Update the user elvi17180@gmail.com to admin
UPDATE public.profiles 
SET user_type = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'elvi17180@gmail.com'
);